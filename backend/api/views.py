from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count
from datetime import datetime
import uuid

from .models import Role, UserProfile, Case, CaseWorkflow, CaseComment, CaseAttachment
from .serializers import (
    RoleSerializer, UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    CaseSerializer, CaseListSerializer, CaseWorkflowSerializer,
    CaseCommentSerializer, CaseAttachmentSerializer
)
from .permissions import IsAdmin, IsEditor, IsViewer, IsAdminOrReadOnly


# ==================== Role Views ====================

class RoleListCreate(generics.ListCreateAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdmin]


# ==================== User Views ====================

class UserListCreate(generics.ListCreateAPIView):
    queryset = User.objects.all().select_related('profile', 'profile__role')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(profile__role__name=role)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset


class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all().select_related('profile', 'profile__role')
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class UserProfileUpdate(generics.UpdateAPIView):
    """Update user profile including role"""
    queryset = User.objects.all()
    permission_classes = [IsAdmin]
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Update profile fields
        if 'role' in request.data and request.data['role']:
            profile.role_id = request.data['role']
        if 'phone' in request.data:
            profile.phone = request.data.get('phone', '')
        if 'address' in request.data:
            profile.address = request.data.get('address', '')
        profile.save()
        
        return Response({'status': 'Profile updated successfully'})


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        return UserSerializer
    
    def get_object(self):
        return User.objects.select_related('profile', 'profile__role').get(pk=self.request.user.pk)

    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()
        
        # Update profile
        if hasattr(user, 'profile'):
            profile = user.profile
            profile.phone = request.data.get('phone', profile.phone)
            profile.address = request.data.get('address', profile.address)
            profile.save()
        
        return Response(UserSerializer(user).data)


# ==================== Case Views ====================

class CaseListCreate(generics.ListCreateAPIView):
    permission_classes = [IsEditor]
    
    def get_serializer_class(self):
        if self.request.method == 'LIST':
            return CaseListSerializer
        return CaseSerializer

    def get_queryset(self):
        user = self.request.user
        role_name = user.profile.role.name if hasattr(user, 'profile') and user.profile.role else None
        
        # Admin and Editor can see all cases
        queryset = Case.objects.all().select_related('created_by', 'assigned_to', 'assigned_to__profile')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Filter by assigned user
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(case_number__icontains=search) |
                Q(name__icontains=search) |
                Q(location__icontains=search)
            )
        
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CaseListSerializer
        return CaseSerializer

    def perform_create(self, serializer):
        # Generate unique case number (format: YYYYMMDD-XXX)
        case_number = f"{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:3].upper()}"
        serializer.save(
            created_by=self.request.user,
            assigned_to=self.request.user,
            case_number=case_number
        )


class CaseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Case.objects.all().select_related('created_by', 'assigned_to', 'assigned_to__profile')
    permission_classes = [IsEditor]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CaseSerializer
        return CaseSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        # Track workflow if status changed
        if 'status' in serializer.validated_data:
            old_status = Case.objects.get(pk=instance.pk).status
            new_status = serializer.validated_data['status']
            if old_status != new_status:
                CaseWorkflow.objects.create(
                    case=instance,
                    previous_status=old_status,
                    new_status=new_status,
                    changed_by=self.request.user
                )


# ==================== Case Workflow Views ====================

class CaseWorkflowList(generics.ListAPIView):
    serializer_class = CaseWorkflowSerializer
    permission_classes = [IsViewer]

    def get_queryset(self):
        case_id = self.kwargs['case_id']
        return CaseWorkflow.objects.filter(case_id=case_id).select_related('changed_by')


# ==================== Case Comment Views ====================

class CaseCommentListCreate(generics.ListCreateAPIView):
    serializer_class = CaseCommentSerializer
    permission_classes = [IsViewer]

    def get_queryset(self):
        case_id = self.kwargs['case_id']
        return CaseComment.objects.filter(case_id=case_id).select_related('user')

    def perform_create(self, serializer):
        case_id = self.kwargs['case_id']
        case = get_object_or_404(Case, pk=case_id)
        serializer.save(case=case, user=self.request.user)


class CaseCommentDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CaseCommentSerializer
    permission_classes = [IsEditor]

    def get_queryset(self):
        case_id = self.kwargs['case_id']
        return CaseComment.objects.filter(case_id=case_id)


# ==================== Case Attachment Views ====================

class CaseAttachmentListCreate(generics.ListCreateAPIView):
    serializer_class = CaseAttachmentSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsEditor]

    def get_queryset(self):
        case_id = self.kwargs['case_id']
        return CaseAttachment.objects.filter(case_id=case_id).select_related('uploaded_by')

    def perform_create(self, serializer):
        case_id = self.kwargs['case_id']
        case = get_object_or_404(Case, pk=case_id)
        
        # Check if it's a file upload or a link
        uploaded_file = self.request.FILES.get('file')
        if uploaded_file:
            file_name = uploaded_file.name
            file_type = uploaded_file.content_type
            file_size = uploaded_file.size
            # In production, save to file system and store path
            file_path = f"attachments/{case_id}/{file_name}"
            
            serializer.save(
                case=case,
                uploaded_by=self.request.user,
                file_name=file_name,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size
            )
        else:
            # Handle link (file_path from request data)
            file_name = self.request.data.get('file_name', 'External Link')
            file_path = self.request.data.get('file_path', '')
            file_type = self.request.data.get('file_type', 'link')
            
            serializer.save(
                case=case,
                uploaded_by=self.request.user,
                file_name=file_name,
                file_path=file_path,
                file_type=file_type,
                file_size=0
            )


# ==================== Dashboard Views ====================

class DashboardStats(generics.ListAPIView):
    permission_classes = [IsViewer]

    def list(self, request, *args, **kwargs):
        # Total cases
        total_cases = Case.objects.count()
        
        # Cases by status
        cases_by_status = Case.objects.values('status').annotate(count=Count('id'))
        
        # Cases by priority
        cases_by_priority = Case.objects.values('priority').annotate(count=Count('id'))
        
        # Cases by assignee
        cases_by_assignee = Case.objects.filter(assigned_to__isnull=False).values(
            'assigned_to__username'
        ).annotate(count=Count('id'))
        
        # Recent cases
        recent_cases = Case.objects.order_by('-created_date')[:5]
        
        return Response({
            'total_cases': total_cases,
            'cases_by_status': {item['status']: item['count'] for item in cases_by_status},
            'cases_by_priority': {item['priority']: item['count'] for item in cases_by_priority},
            'cases_by_assignee': list(cases_by_assignee),
            'recent_cases': CaseListSerializer(recent_cases, many=True).data
        })


# ==================== User Registration ====================

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            UserSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED
        )
