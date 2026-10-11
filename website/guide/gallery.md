# Capture plan

Status: **Deferred**. No component captures are published in this documentation.
The mobile example is the interactive demonstration; capture work will follow
once each component and its behavior contract are ready for documentation.

## Reserved capture matrix

| Family | Example screen | Planned states |
| --- | --- | --- |
| Button | Controls → Buttons | Every appearance/size, pressed, disabled, destructive, long label |
| TextField | Controls → Text fields | Every variant, focused, helper/error, secure/revealed, disabled |
| Switch / SegmentedControl | Controls | Accepted/rejected request, selection, disabled |
| List / Form | Lists and forms | Every appearance, headers/footer, scrolled anchor, controlled rows |
| Stack / Tabs | Navigation behaviors and app tabs | Compact/large header, Back, tab/rail/sidebar, restoration |
| Sheet / TabContent | Containers and presentation | Detents, locked dismissal, mounted page states |

Each future capture must record platform, OS, device dimensions, theme, variant,
size, state and source revision. iOS and Android have separate capture sets.
Large text, RTL and tablet layouts need distinct records. Gesture and interaction
checks remain separate from still images.

No HTML imitation of a control is used as proof of UIKit or Material output.
Until captures are added, [run the example](getting-started.md) and use the
[specification and behavior map](../guide/native-specs.md).
