# In-screen pages and motion

Status: **Experimental**. TabContent is an in-screen page host; app navigation
uses Tabs. Pages remain mounted while inactive to retain React state.

```tsx
<TabContent value={selected} style={{flex: 1}}>
  <TabPage id="first"><FirstScreen /></TabPage>
  <TabPage id="second"><SecondScreen /></TabPage>
</TabContent>
```

TransitionView animates replaced children with a changed key:

```tsx
<TransitionView motion="fadeThrough" style={{flex: 1}}>
  <Content key={selected} />
</TransitionView>
```

Motion names are library contracts, not equivalent UIKit visual variants.
The API and platform mappings are recorded in the
[experimental API](../reference/API-PROPOSAL.md). Reduced Motion and accessibility
focus acceptance remain open. Prefer the navigator for actual screen transitions.
