rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }

    // Assignment submissions
    match /institutions/{schoolId}/students/{studentId}/subjects/{subjectId}/{file} {
      allow read: if isSignedIn() && (
        studentId == uid() ||
        request.auth.token.role in ['teacher','hod','principal']
      );
      allow write: if isSignedIn() && studentId == uid()
                   && request.resource.size < 25 * 1024 * 1024;
    }

    // School logos / branding
    match /platform_branding/{file} {
      allow read: if true;
      allow write: if isSignedIn() && request.auth.token.role in ['principal','corporate'];
    }

    // Anonymous report attachments
    match /anonymous_reports/{file} {
      allow read: if isSignedIn() && request.auth.token.role in ['security','principal'];
      allow write: if isSignedIn() && request.resource.size < 10 * 1024 * 1024;
    }

    // Catch-all — deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}