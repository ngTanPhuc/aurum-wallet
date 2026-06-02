import os

p = "src/screens/DashboardScreen.tsx"
with open(p, "r") as f:
    c = f.read()

# 1. Add state for scroll progress
state_anchor = "const balance = getTotalBalance();"
if "const [metricScroll, setMetricScroll] = useState(0);" not in c:
    c = c.replace(state_anchor, "const [metricScroll, setMetricScroll] = React.useState(0);\n  " + state_anchor)

# 2. Modify ScrollView to track scroll and add the slider
old_scroll = "<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScrollContent}>"

new_scroll = """<ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.metricsScrollContent}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const maxScroll = contentSize.width - layoutMeasurement.width;
              if (maxScroll > 0) {
                setMetricScroll(Math.min(1, Math.max(0, contentOffset.x / maxScroll)));
              }
            }}
          >"""

c = c.replace(old_scroll, new_scroll)

# 3. Add the slider below the ScrollView
old_view_end = "</ScrollView>\n        </View>"
slider_ui = """</ScrollView>
          <View style={{ width: 40, height: 4, backgroundColor: theme.colors.border, alignSelf: 'center', marginTop: 12, borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ width: 20, height: 4, backgroundColor: theme.colors.primary, borderRadius: 2, transform: [{ translateX: metricScroll * 20 }] }} />
          </View>
        </View>"""
c = c.replace(old_view_end, slider_ui)

with open(p, "w") as f:
    f.write(c)
print("Added slider.")
