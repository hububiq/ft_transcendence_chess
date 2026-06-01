import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from faker import Faker
from users.models import User, Profile

fake = Faker()

def seed_database(num_fake_users=20):
    print("Deleting old mocked data...")
    User.objects.filter(is_superuser=False).delete()

    print("Creating specific test accounts...")
    
    hubert = User.objects.create_user(username="Hubert", email="h@test.com", password="123")
    Profile.objects.create(user=hubert, elo_rating=1500, bio="The Systems Architect.")
    
    bot_easy = User.objects.create_user(username="Bot_Easy", email="bot1@test.com", password="123", is_bot=True, bot_difficulty=1)
    Profile.objects.create(user=bot_easy, elo_rating=800, bio="I am an easy AI.")

    bot_hard = User.objects.create_user(username="Bot_Hard", email="bot3@test.com", password="123", is_bot=True, bot_difficulty=3)
    Profile.objects.create(user=bot_hard, elo_rating=2000, bio="I am a terminator AI.")

    print(f"Generating {num_fake_users} random fake users...")
    
    for _ in range(num_fake_users):
        user = User.objects.create_user(
            username=fake.unique.user_name(), # .unique prevents duplicate name crashes
            email=fake.unique.email(),
            password="password123" 
        )
        Profile.objects.create(
            user=user,
            elo_rating=fake.random_int(min=800, max=2500),
            bio=fake.sentence(),
            avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}"
        )

    print("Database successfully seeded with test accounts and fake data!")

if __name__ == "__main__":
    seed_database()