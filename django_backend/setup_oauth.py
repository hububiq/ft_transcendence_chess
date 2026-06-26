import os
import django

# Bootstrap Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def setup_oauth():
    print("Configuring Site domain...")
    site, created = Site.objects.get_or_create(id=1)
    site.domain = 'localhost:8000'
    site.name = 'localhost:8000'
    site.save()

    print("Injecting GitHub Secrets from .env...")
    github_client_id = os.environ.get('GITHUB_CLIENT_ID')
    github_secret = os.environ.get('GITHUB_SECRET')

    if github_client_id and github_secret:
        github_app, created = SocialApp.objects.get_or_create(
            provider='github',
            name='GitHub Local',
            client_id=github_client_id,
        )
        github_app.secret = github_secret
        github_app.save()
        github_app.sites.add(site)
        print("GitHub OAuth app created securely!")
    else:
        print("Warning: GITHUB_CLIENT_ID or GITHUB_SECRET not found in .env.")

if __name__ == "__main__":
    setup_oauth()