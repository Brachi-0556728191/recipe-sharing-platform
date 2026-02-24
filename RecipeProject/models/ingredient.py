# models/ingredient.py

from database import db
from models.base_model import BaseModel

class Ingredient(BaseModel):
    __tablename__ = 'ingredients'

    # מפתח זר: מקשר למתכון שאליו שייך הרכיב
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

    # שדות הרכיב
    name = db.Column(db.String(100), nullable=False) # שם המוצר (קמח, ביצים)
    amount = db.Column(db.Float, nullable=True)     # כמות
    unit = db.Column(db.String(20), nullable=True)  # יחידה (גרם, כוסות, יחידות)

    def __repr__(self):
        return f'<Ingredient {self.name} for Recipe ID {self.recipe_id}>'