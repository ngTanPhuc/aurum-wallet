import json

with open("app.json", "r") as f:
    data = json.load(f)

data["expo"]["icon"] = "./assets/logo.png"
data["expo"]["backgroundColor"] = "#020C17"

if "android" in data["expo"] and "adaptiveIcon" in data["expo"]["android"]:
    data["expo"]["android"]["adaptiveIcon"]["backgroundColor"] = "#020C17"
    data["expo"]["android"]["adaptiveIcon"]["foregroundImage"] = "./assets/logo.png"
    
    # Remove old specific images to avoid conflicts
    if "backgroundImage" in data["expo"]["android"]["adaptiveIcon"]:
        del data["expo"]["android"]["adaptiveIcon"]["backgroundImage"]
    if "monochromeImage" in data["expo"]["android"]["adaptiveIcon"]:
        del data["expo"]["android"]["adaptiveIcon"]["monochromeImage"]

if "web" in data["expo"]:
    data["expo"]["web"]["favicon"] = "./assets/logo.png"

with open("app.json", "w") as f:
    json.dump(data, f, indent=2)

print("Updated app.json")
