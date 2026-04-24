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
import csv
import io
from django.http import HttpResponse

from .models import Role, UserProfile, Case, CaseActivity, CaseComment, CaseAttachment
from .serializers import (
    RoleSerializer, UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    CaseSerializer, CaseListSerializer, CaseActivitySerializer,
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

        # Filter by case_type
        case_type_filter = self.request.query_params.get('case_type', None)
        if case_type_filter:
            queryset = queryset.filter(case_type=case_type_filter)

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
        case = serializer.save(
            created_by=self.request.user,
            assigned_to=self.request.user,
            case_number=case_number
        )
        # Track case creation activity
        CaseActivity.objects.create(
            case=case,
            activity_type='case_created',
            new_value=case_number,
            changed_by=self.request.user,
            notes=f"Case created: {case.name}"
        )


class CaseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Case.objects.all().select_related('created_by', 'assigned_to', 'assigned_to__profile')
    permission_classes = [IsEditor]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CaseSerializer
        return CaseSerializer

    def perform_update(self, serializer):
        instance = serializer.instance  # Get the old instance before saving
        # Track status change
        old_status = instance.status
        old_priority = instance.priority
        
        instance = serializer.save()
        
        # Track status change
        if 'status' in serializer.validated_data:
            new_status = serializer.validated_data['status']
            if old_status != new_status:
                CaseActivity.objects.create(
                    case=instance,
                    activity_type='status_change',
                    previous_value=old_status,
                    new_value=new_status,
                    changed_by=self.request.user
                )
        # Track priority change
        if 'priority' in serializer.validated_data:
            new_priority = serializer.validated_data['priority']
            if old_priority != new_priority:
                CaseActivity.objects.create(
                    case=instance,
                    activity_type='priority_change',
                    previous_value=old_priority,
                    new_value=new_priority,
                    changed_by=self.request.user
                )


# ==================== CSV Import/Export Views ====================

class CaseCSVImportView(generics.GenericAPIView):
    """Import cases from CSV file"""
    permission_classes = [IsEditor]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        csv_file = request.FILES.get('csv_file')
        
        if not csv_file:
            return Response(
                {'error': 'No CSV file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be a CSV'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read CSV file
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            # Validate required headers
            required_fields = {'name', 'location', 'status', 'case_type', 'priority', 'description'}
            if not required_fields.issubset(set(reader.fieldnames)):
                missing = required_fields - set(reader.fieldnames)
                return Response(
                    {'error': f'Missing required fields: {", ".join(missing)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            imported_cases = []
            errors = []
            
            for index, row in enumerate(reader, start=1):
                try:
                    # Validate status
                    status_value = row.get('status', '').strip()
                    valid_statuses = dict(Case.STATUS_CHOICES).keys()
                    if status_value not in valid_statuses:
                        errors.append(f"Row {index}: Invalid status '{status_value}'")
                        continue
                    
                    # Validate case_type
                    case_type_value = row.get('case_type', '').strip()
                    valid_case_types = dict(Case.CASE_TYPE_CHOICES).keys()
                    if case_type_value not in valid_case_types:
                        errors.append(f"Row {index}: Invalid case type '{case_type_value}'")
                        continue
                    
                    # Validate priority
                    priority_value = row.get('priority', '').strip()
                    valid_priorities = dict(Case.PRIORITY_CHOICES).keys()
                    if priority_value not in valid_priorities:
                        errors.append(f"Row {index}: Invalid priority '{priority_value}'")
                        continue
                    
                    # Handle assigned_to (optional - can be username or empty)
                    assigned_to = None
                    assigned_username = row.get('assigned_to', '').strip()
                    if assigned_username:
                        try:
                            assigned_to = User.objects.get(username=assigned_username)
                        except User.DoesNotExist:
                            errors.append(f"Row {index}: User '{assigned_username}' not found")
                            continue
                    
                    # Generate unique case number
                    case_number = f"{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:3].upper()}"
                    
                    # Create case
                    case = Case.objects.create(
                        case_number=case_number,
                        name=row.get('name', '').strip(),
                        location=row.get('location', '').strip(),
                        status=status_value,
                        case_type=case_type_value,
                        priority=priority_value,
                        description=row.get('description', '').strip(),
                        created_by=request.user,
                        assigned_to=assigned_to
                    )
                    
                    # Track case creation activity
                    CaseActivity.objects.create(
                        case=case,
                        activity_type='case_created',
                        new_value=case_number,
                        changed_by=request.user,
                        notes=f"Case created via CSV import: {case.name}"
                    )
                    
                    imported_cases.append(case.id)
                    
                except Exception as e:
                    errors.append(f"Row {index}: {str(e)}")
            
            return Response({
                'imported_count': len(imported_cases),
                'imported_ids': imported_cases,
                'errors': errors
            }, status=status.HTTP_201_CREATED)
            
        except UnicodeDecodeError:
            return Response(
                {'error': 'Unable to decode file. Please ensure file is UTF-8 encoded'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CaseSampleDownloadView(generics.GenericAPIView):
    """Download sample CSV format for case import"""
    permission_classes = [IsEditor]
    
    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="case_import_sample.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'name', 'location', 'status', 'case_type', 'priority', 
            'description', 'assigned_to'
        ])
        
        # Write sample rows
        writer.writerow([
            'Sample Case Name',
            'Sample Location',
            'Open',
            'Inquiry',
            'Medium',
            'Sample description for the case',
            ''  # assigned_to is optional - leave blank for unassigned
        ])
        
        return response


# ==================== Case Activity Views ====================

class CaseActivityList(generics.ListAPIView):
    serializer_class = CaseActivitySerializer
    permission_classes = [IsViewer]

    def get_queryset(self):
        case_id = self.kwargs['case_id']
        return CaseActivity.objects.filter(case_id=case_id).select_related('changed_by')


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
            original_name = uploaded_file.name
            file_type = uploaded_file.content_type
            file_size = uploaded_file.size
            
            # Generate file name using case_id and created_date convention
            # Format: {case_id}_{created_date}.{extension}
            import os
            file_extension = os.path.splitext(original_name)[1]  # Get file extension
            created_date = datetime.now().strftime('%Y%m%d_%H%M%S')
            new_file_name = f"{case_id}_{created_date}{file_extension}"
            
            # In production, save to file system and store path
            file_path = f"attachments/{case_id}/{new_file_name}"
            
            attachment = serializer.save(
                case=case,
                uploaded_by=self.request.user,
                file_name=new_file_name,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size
            )
            # Track attachment activity
            CaseActivity.objects.create(
                case=case,
                activity_type='attachment_added',
                new_value=f"File uploaded: {new_file_name}",
                changed_by=self.request.user
            )
        else:
            # Handle link (file_path from request data)
            file_name = self.request.data.get('file_name', 'External Link')
            file_path = self.request.data.get('file_path', '')
            file_type = self.request.data.get('file_type', 'link')
            
            attachment = serializer.save(
                case=case,
                uploaded_by=self.request.user,
                file_name=file_name,
                file_path=file_path,
                file_type=file_type,
                file_size=0
            )
            # Track attachment activity
            CaseActivity.objects.create(
                case=case,
                activity_type='attachment_added',
                new_value=f"Link added: {file_name}",
                changed_by=self.request.user
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
