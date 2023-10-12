"""Integration tests for the auth router"""


def test_admin_authorize():
    """Admin users can authorize at /auth/github/authorize"""
    pass


def test_chalmers_authorize():
    """Chalmers users can authorize at /auth/chalmers/authorize"""
    pass


def test_puhuri_authorize():
    """Puhuri users can authorize at /auth/puhuri/authorize"""
    pass


def test_partner_authorize():
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    pass


def test_admin_create_project():
    """Admins can create projects at /auth/projects/"""
    pass


def test_non_admin_cannot_create_project():
    """Non-admins cannot create projects at /auth/projects/"""
    pass


def test_admin_update_project():
    """Admins can create projects at /auth/projects/{id}"""
    pass


def test_non_admin_cannot_update_project():
    """Non-admins cannot create projects at /auth/projects/{id}"""
    pass


def test_admin_delete_project():
    """Admins can delete projects at /auth/projects/{id}"""
    pass


def test_non_admin_cannot_delete_project():
    """Non-admins cannot delete projects at /auth/projects/{id}"""
    pass


def test_admin_view_all_projects_in_detail():
    """Admins can view projects at /auth/projects/ in full detail"""
    pass


def test_non_admin_view_own_projects_in_less_detail():
    """Non admins can view only their own projects at /auth/me/projects/
    without user_ids"""
    pass


def test_admin_view_single_project_in_detail():
    """Admins can view single project at /auth/projects/{id} in full detail"""
    pass


def test_non_admin_view_own_project_in_less_detail():
    """Non admins can view only their own single project at /auth/me/projects/{id}
    without user_ids"""
    pass


def test_generate_app_token():
    """At /auth/me/app-tokens/, user can generate app token for project they are attached to"""
    pass


def test_destroy_app_token():
    """At /auth/me/app-tokens/{token}, user can destroy their own app token"""
    pass


def test_view_own_app_token_in_less_detail():
    """At /auth/me/app-tokens/, user can view their own app tokens
    without the token itself displayed"""
    pass


def test_expired_app_token_fails():
    """Expired app tokens raise 401 HTTP error"""
    pass


def test_app_token_of_unallocated_projects_fails():
    """App tokens for projects with qpu_seconds <= 0 raise 403 HTTP error"""
    pass
