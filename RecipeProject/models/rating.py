# models/rating.py

from database import db
from models.base_model import BaseModel


class Rating(BaseModel):
    __tablename__ = 'ratings'

    # מפתחות זרים:
    # המשתמש שדירג
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # המתכון שדורג
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

    # ציון הדירוג (1-5)
    score = db.Column(db.Integer, nullable=False)

    # מונע ממשתמש לדרג מתכון יותר מפעם אחת
    __table_args__ = (db.UniqueConstraint('user_id', 'recipe_id', name='_user_recipe_uc'),)

    def __repr__(self):
        return f'<Rating {self.score} by User {self.user_id} for Recipe {self.recipe_id}>'