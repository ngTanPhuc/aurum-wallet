import json

with open("app.json", "r") as f:
    data = json.load(f)

if "android" not in data["expo"]:
    data["expo"]["android"] = {}

data["expo"]["android"]["softwareKeyboardLayoutMode"] = "pan"

with open("app.json", "w") as f:
    json.dump(data, f, indent=2)

print("Updated app.json")
