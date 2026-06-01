import os

category_service_path = "src/services/CategoryService.ts"
insight_engine_path = "src/services/InsightEngine.ts"

if os.path.exists(category_service_path):
    with open(category_service_path, "r") as f:
        content = f.read()
    
    replacements = {
        "'🍔'": "'fast-food'",
        "'☕'": "'cafe'",
        "'🛒'": "'cart'",
        "'🚌'": "'bus'",
        "'🛍️'": "'bag'",
        "'🎬'": "'film'",
        "'📚'": "'book'",
        "'💊'": "'medkit'",
        "'🏠'": "'home'",
        "'⚡'": "'flash'",
        "'📱'": "'phone-portrait'",
        "'✈️'": "'airplane'",
        "'🔄'": "'repeat'",
        "'💻'": "'laptop'",
        "'💵'": "'cash'",
        "'📈'": "'trending-up'",
        "'↩️'": "'arrow-undo'",
        "'📦'": "'cube'",
        "'💰'": "'wallet'", # For Salary, etc.
        "'🎁'": "'gift'"
    }
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(category_service_path, "w") as f:
        f.write(content)

if os.path.exists(insight_engine_path):
    with open(insight_engine_path, "r") as f:
        content = f.read()
        
    replacements = {
        "'💰'": "'wallet'",
        "'📉'": "'trending-down'",
        "'⚠️'": "'warning'",
        "'👀'": "'eye'",
        "'📈'": "'trending-up'"
    }
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(insight_engine_path, "w") as f:
        f.write(content)

print("Services updated.")
