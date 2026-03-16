from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Role, Permission, UserProfile, Case, CaseWorkflow, CaseComment, CaseAttachment


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['created_at']


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name', 'role', 'role_name', 'phone', 'address', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'profile']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email', ''),
            password=validated_data.get('password'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create user profile
        UserProfile.objects.create(user=user)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user - username and password not required"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False}
        }


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role_id']

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email', ''),
            password=validated_data.get('password'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create user profile with role
        profile = UserProfile.objects.create(user=user)
        if role_id:
            try:
                role = Role.objects.get(id=role_id)
                profile.role = role
                profile.save()
            except Role.DoesNotExist:
                pass
        return user


class CaseWorkflowSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = CaseWorkflow
        fields = ['id', 'case', 'previous_status', 'new_status', 'changed_by', 'changed_by_username', 'timestamp', 'notes']
        read_only_fields = ['timestamp']


class CaseCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    case = serializers.PrimaryKeyRelatedField(read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = CaseComment
        fields = ['id', 'case', 'user', 'user_username', 'comment', 'timestamp', 'updated_at']
        read_only_fields = ['timestamp', 'updated_at', 'user', 'case']


class CaseAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    case = serializers.PrimaryKeyRelatedField(read_only=True)
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True)
    # Make fields optional since they're populated in perform_create
    file_name = serializers.CharField(required=False, allow_blank=True)
    file_path = serializers.CharField(required=False, allow_blank=True)
    file_type = serializers.CharField(required=False, allow_blank=True)
    file_size = serializers.IntegerField(required=False, default=0)
    
    class Meta:
        model = CaseAttachment
        fields = ['id', 'case', 'file_name', 'file_path', 'file_type', 'file_size', 'uploaded_by', 'uploaded_by_username', 'uploaded_at']
        read_only_fields = ['uploaded_at', 'case', 'uploaded_by']


class CaseSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    workflows = CaseWorkflowSerializer(many=True, read_only=True)
    comments = CaseCommentSerializer(many=True, read_only=True)
    attachments = CaseAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_number', 'name', 'location', 'status', 'description', 
            'priority', 'created_by', 'created_by_username', 'assigned_to', 
            'assigned_to_username', 'created_date', 'updated_date',
            'workflows', 'comments', 'attachments'
        ]
        read_only_fields = ['case_number', 'created_by', 'created_date', 'updated_date']


class CaseListSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_number', 'name', 'location', 'status', 'priority', 'description',
            'created_by', 'created_by_username', 'assigned_to', 'assigned_to_username',
            'created_date', 'updated_date'
        ]
