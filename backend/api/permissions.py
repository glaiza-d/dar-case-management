from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow only admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role and request.user.profile.role.name == 'Admin'


class IsEditor(permissions.BasePermission):
    """Allow admin and editor users"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile') or not request.user.profile.role:
            return False
        return request.user.profile.role.name in ['Admin', 'Editor']


class IsViewer(permissions.BasePermission):
    """Allow all authenticated users (Admin, Editor, Viewer)"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read for all, write only for admin"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role and request.user.profile.role.name == 'Admin'


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owner or admin"""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or (hasattr(request.user, 'profile') and request.user.profile.role and request.user.profile.role.name == 'Admin')
        return hasattr(request.user, 'profile') and request.user.profile.role and request.user.profile.role.name == 'Admin'
