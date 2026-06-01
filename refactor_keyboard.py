import os
import re

files_to_process = [
    "src/screens/AddTransactionScreen.tsx",
    "src/screens/AddEditBudgetScreen.tsx",
    "src/screens/AddEditSavingsGoalScreen.tsx",
    "src/screens/AddEditWalletScreen.tsx",
    "src/screens/AddEditRecurringTransactionScreen.tsx",
    "src/screens/AddEditTemplateScreen.tsx",
    "src/screens/OnboardingScreen.tsx",
    "src/screens/SavingsGoalDetailScreen.tsx"
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Add import
    if "KeyboardAwareScrollView" not in content:
        content = re.sub(r"(import React.*?;\n)", r"\1import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';\n", content, count=1)
    
    # 1. Replace <KeyboardAvoidingView> wrappers with <View> if they exist
    # Note: KeyboardAvoidingView could span multiple lines.
    content = re.sub(r"<KeyboardAvoidingView[^>]*>", r"<View style={{ flex: 1, backgroundColor: theme.colors.background }}>", content)
    content = re.sub(r"</KeyboardAvoidingView>", r"</View>", content)
    
    # 2. Replace the main vertical ScrollView.
    # Usually it's: <ScrollView style={styles.container} ...> or <ScrollView contentContainerStyle={styles.scroll}>
    # We will ONLY replace ScrollView that doesn't have 'horizontal' in its props.
    # To do this safely, we can replace ALL <ScrollView ...> that do not contain 'horizontal'
    # Wait, some <ScrollView> have 'horizontal={true}' or just 'horizontal'.
    def replace_scrollview(match):
        tag_content = match.group(1)
        if 'horizontal' not in tag_content:
            return f"<KeyboardAwareScrollView enableOnAndroid={{true}} keyboardShouldPersistTaps=\"handled\" {tag_content}"
        return match.group(0)
    
    content = re.sub(r"<ScrollView([^>]*)", replace_scrollview, content)
    
    # Now replace closing tags for the vertical ScrollView.
    # Since we can't easily distinguish closing tags, let's just count how many KeyboardAwareScrollView we opened vs closed.
    # Actually, a better approach for closing tags:
    # We replaced vertical <ScrollView> with <KeyboardAwareScrollView>. We need to replace the corresponding </ScrollView>.
    # Since horizontal ScrollViews are self-contained (usually no inner scrollviews), we can just replace ALL </ScrollView> with </KeyboardAwareScrollView>
    # EXCEPT for the ones that close a horizontal scroll view.
    # Let's just do a manual replacement for horizontal ones. Wait, horizontal scroll views usually look like:
    # <ScrollView horizontal ...> ... </ScrollView>
    # It's easier to find <ScrollView horizontal.*?>.*?</ScrollView> and temporarily mask them!
    
    masked_content = content
    masks = []
    
    def mask_horizontal(match):
        masks.append(match.group(0))
        return f"__HORIZONTAL_SCROLLVIEW_{len(masks)-1}__"
    
    masked_content = re.sub(r"<ScrollView horizontal.*?>(.*?)</ScrollView>", mask_horizontal, masked_content, flags=re.DOTALL)
    
    # Now in the masked content, all remaining <ScrollView> are vertical. Wait, some might be <ScrollView ... horizontal={false} ...> (none are).
    # But wait, earlier we already replaced the opening tag of vertical ones with <KeyboardAwareScrollView!
    # So we only need to replace </ScrollView> with </KeyboardAwareScrollView> in the masked content!
    masked_content = masked_content.replace("</ScrollView>", "</KeyboardAwareScrollView>")
    
    # Now unmask
    for i, mask in enumerate(masks):
        masked_content = masked_content.replace(f"__HORIZONTAL_SCROLLVIEW_{i}__", mask)
    
    content = masked_content
    
    # 3. Special case for OnboardingScreen which didn't have a vertical ScrollView at all.
    if "OnboardingScreen.tsx" in file_path:
        # In Onboarding, there was no vertical scroll view, just a <View style={styles.container}>.
        # Let's change that View to KeyboardAwareScrollView.
        content = content.replace("<View style={styles.container}>", "<KeyboardAwareScrollView style={styles.container} enableOnAndroid={true} keyboardShouldPersistTaps=\"handled\">")
        # And we need to replace the corresponding </View>. Since it's right before the closing root tag, which is now </View>
        content = content.replace("</View>\n    </View>", "</KeyboardAwareScrollView>\n    </View>")

    with open(file_path, 'w') as f:
        f.write(content)

print("Done")
