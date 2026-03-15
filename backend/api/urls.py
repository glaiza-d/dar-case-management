from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('user/register/', views.CreateUserView.as_view(), name='register'),
    path('user/me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # Users
    path('users/', views.UserListCreate.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetail.as_view(), name='user-detail'),
    
    # Roles
    path('roles/', views.RoleListCreate.as_view(), name='role-list-create'),
    
    # Cases
    path('cases/', views.CaseListCreate.as_view(), name='case-list-create'),
    path('cases/<int:pk>/', views.CaseDetail.as_view(), name='case-detail'),
    
    # Case Workflow
    path('cases/<int:case_id>/workflow/', views.CaseWorkflowList.as_view(), name='case-workflow'),
    
    # Case Comments
    path('cases/<int:case_id>/comments/', views.CaseCommentListCreate.as_view(), name='case-comment-list-create'),
    path('cases/<int:case_id>/comments/<int:pk>/', views.CaseCommentDetail.as_view(), name='case-comment-detail'),
    
    # Case Attachments
    path('cases/<int:case_id>/attachments/', views.CaseAttachmentListCreate.as_view(), name='case-attachment-list-create'),
    
    # Dashboard
    path('dashboard/stats/', views.DashboardStats.as_view(), name='dashboard-stats'),
]
