# VINA-450: Deep Investigation — Emoji/GIF Picker DOM + Stacking Context

## Issue Summary
The Emoji and GIF picker popovers in the RichTextEditor have stacking context and DOM positioning issues, particularly when the editor is used inside a Dialog (as in Community.tsx).

## Root Causes Identified

### 1. **Dialog Stacking Context Conflict**
- **Location**: `src/pages/Community.tsx` and `src/pages/CommunityPost.tsx`
- **Problem**: RichTextEditor is rendered inside DialogContent
- **Impact**: When emoji/gif picker poppover opens, it may be visually trapped behind the dialog or positioned incorrectly
- **Current State**:
  - DialogOverlay: `z-50`
  - DialogContent: `z-50`
  - PopoverContent (default): `z-50`
  - PopoverContent (RichTextEditor override): `z-[9999]`

### 2. **CSS Class Override Issue**
- **Location**: `src/components/RichTextEditor.tsx` lines 147 & 157
- **Problem**: PopoverContent className tries to override `z-50` with `z-[9999]`, but this may not work due to:
  - CSS specificity issues
  - Radix UI inline styles taking precedence
  - Tailwind class ordering
- **Evidence**: Manual z-index override was added as a workaround, suggesting the base component wasn't providing sufficient z-index

### 3. **Portal Positioning**
- **Location**: `src/components/ui/popover.tsx`
- **Issue**: PopoverContent is correctly using `PopoverPrimitive.Portal`, but it still respects the document flow inside the Dialog
- **Expected**: Popovers should float above all content including dialogs

## Component Hierarchy
```
Body
├── Dialog
│   ├── DialogOverlay (z-50)
│   └── DialogContent (z-50)
│       └── RichTextEditor
│           ├── Popover (emoji picker)
│           │   └── PopoverContent (z-[9999] override attempt)
│           └── Popover (gif picker)
│               └── PopoverContent (z-[9999] override attempt)
└── Portal Root (for Popover - should be at body level via Portal)
    ├── PopoverContent (emoji)
    └── PopoverContent (gif)
```

## Solution Strategy

### Phase 1: Increase Dialog Z-Index
- Change DialogOverlay and DialogContent to `z-40` (lower than popover)
- This allows PopoverContent to reliably sit above dialogs

### Phase 2: Fix PopoverContent Z-Index
- Update PopoverContent component default to `z-50` (or higher)
- Ensure Tailwind classes properly override the default
- Add explicit z-index management in high-context scenarios

### Phase 3: Verify Portal Behavior
- Confirm popovers escape dialog overflow:hidden constraints
- Test positioning in various dialog sizes and positions

## Files to Modify
- `src/components/ui/dialog.tsx` - Adjust z-index strategy
- `src/components/ui/popover.tsx` - Ensure proper z-index defaults
- `src/components/RichTextEditor.tsx` - Remove manual z-index overrides once component is fixed

## Testing Checklist
- [ ] Emoji picker opens above dialog in Community page
- [ ] GIF picker opens above dialog in Community page  
- [ ] Emoji picker opens above dialog in CommunityPost page
- [ ] GIF picker opens above dialog in CommunityPost page
- [ ] Mobile responsive: pickers display correctly on mobile
- [ ] No regression: other dialogs and popovers still work correctly
- [ ] z-index cleanup: manual overrides can be removed

## Related Issues
- VINA-439: emoji and gif picker popover positioning fixes
- VINA-445: Remove manual onClick handlers from emoji/gif picker buttons
