# Switch and SegmentedControl

Status: **Experimental**. Both controls are controlled: native interaction
requests a value; the application accepts by updating its committed prop.
Rejected requests restore the committed value.

## Switch

```tsx
<Switch label="Notifications" value={notifications}
  onValueChange={setNotifications} />
<Switch label="Locked" value={false} disabled onValueChange={() => {}} />
```

UISwitch owns iOS presentation; MaterialSwitch owns Android presentation.
On/off and disabled are states. An iPhone checkbox appearance is not exposed.

## SegmentedControl

```tsx
<SegmentedControl
  segments={[{id: 'day', label: 'Day'}, {id: 'week', label: 'Week'}]}
  value={range} onValueChange={setRange} />
```

The current contract supports text segments and persistent single selection.
Icons, momentary actions and additional width policies are not exposed.

Try Components → Switches and Segmented control in the example. Verify accepted
and rejected requests, disabled interaction and selection feedback. Spoken
accessibility and broad device coverage remain open.

[Full experimental API](../reference/API-PROPOSAL.md).
