from django.contrib import admin
from .models import Role, Permission, UserProfile, Case, CaseWorkflow, CaseComment, CaseAttachment

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'created_at']
    list_filter = ['role']
    search_fields = ['user__username', 'user__email']

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'name', 'status', 'priority', 'created_by', 'assigned_to', 'created_date']
    list_filter = ['status', 'priority']
    search_fields = ['case_number', 'name', 'location']
    readonly_fields = ['case_number', 'created_date', 'updated_date']

@admin.register(CaseWorkflow)
class CaseWorkflowAdmin(admin.ModelAdmin):
    list_display = ['case', 'previous_status', 'new_status', 'changed_by', 'timestamp']
    list_filter = ['new_status']
    search_fields = ['case__case_number']

@admin.register(CaseComment)
class CaseCommentAdmin(admin.ModelAdmin):
    list_display = ['case', 'user', 'comment', 'timestamp']
    search_fields = ['case__case_number', 'user__username']

@admin.register(CaseAttachment)
class CaseAttachmentAdmin(admin.ModelAdmin):
    list_display = ['case', 'file_name', 'uploaded_by', 'uploaded_at']
    search_fields = ['case__case_number', 'file_name']
