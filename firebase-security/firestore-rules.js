// Enhanced Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if hasRole(['admin', 'principal']);
    }
    
    // Portal-specific access
    match /{portal}/{document} {
      allow read, write: if hasPortalAccess(portal);
    }
    
    // Camera access control
    match /cameras/{cameraId} {
      allow read: if hasCameraAccess(cameraId, 'view');
      allow write: if hasRole(['admin', 'security']);
    }
    
    // Security logs - restricted access
    match /security_logs/{logId} {
      allow read: if hasRole(['admin', 'security']);
      allow write: if request.auth != null;
    }
    
    // Function definitions
    function hasRole(roles) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in roles;
    }
    
    function hasPortalAccess(portal) {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.portals.hasAny([portal]);
    }
    
    function hasCameraAccess(cameraId, action) {
      let userRole = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
      let cameraData = get(/databases/$(database)/documents/cameras/$(cameraId));
      
      return userRole in ['security', 'admin'] || 
             (userRole == 'principal' && cameraData.data.location in ['entrance', 'hallway']);
    }
  }
}