# def validate_ingredient(ingredient, index):
#     errors = []
#
#     # name
#     name = ingredient.get('name')
#     if not name or not isinstance(name, str) or not name.strip():
#         errors.append(f"Ingredient #{index}: name is required and must be a non-empty string")
#
#     # amount
#     amount = ingredient.get('amount')
#     if amount is None:
#         errors.append(f"Ingredient #{index}: amount is required")
#     elif not isinstance(amount, (int, float)):
#         errors.append(f"Ingredient #{index}: amount must be a number")
#     elif amount <= 0:
#         errors.append(f"Ingredient #{index}: amount must be greater than 0")
#
#     # unit
#     unit = ingredient.get('unit')
#     if not unit or not isinstance(unit, str) or not unit.strip():
#         errors.append(f"Ingredient #{index}: unit is required and must be a non-empty string")
#
#     return errors
def validate_ingredient(ingredient, index):
    """
    בודקת תקינות של רכיב.
    מחזירה רשימה של שגיאות מובנות לפי שדה.
    index - אינדקס אנושי של הרכיב (מתחיל מ-1)
    """
    errors = []

    # בדיקת שם
    name = ingredient.get('name')
    if not name or not isinstance(name, str) or not name.strip():
        errors.append({'field': 'name', 'message': f'Ingredient #{index}: name is required and must be a non-empty string'})

    # בדיקת כמות
    amount = ingredient.get('amount')
    if amount is None:
        errors.append({'field': 'amount', 'message': f'Ingredient #{index}: amount is required'})
    elif not isinstance(amount, (int, float)):
        errors.append({'field': 'amount', 'message': f'Ingredient #{index}: amount must be a number'})
    elif amount <= 0:
        errors.append({'field': 'amount', 'message': f'Ingredient #{index}: amount must be greater than 0'})

    # בדיקת יחידת מידה
    unit = ingredient.get('unit')
    if not unit or not isinstance(unit, str) or not unit.strip():
        errors.append({'field': 'unit', 'message': f'Ingredient #{index}: unit is required and must be a non-empty string'})

    return errors
