# HeroUI Component Rules

Source: https://www.heroui.com/docs/frameworks/nextjs

These rules are mandatory. All HeroUI component usage MUST follow these conventions exactly.

---

## 1. Setup & Provider

### Installation
```bash
npm install @heroui/react framer-motion
```

For date/time components, also install:
```bash
npm install @internationalized/date
```

### Tailwind CSS v4 Config (`tailwind.config.ts`)
```ts
import { heroui } from "@heroui/theme"

export default {
  plugins: [heroui()]
}
```

### HeroUIProvider (Root Layout)
- Create a `providers.tsx` Client Component — do NOT put provider directly in Server Component layout.
- Wrap the entire app in `HeroUIProvider`.

```tsx
// app/providers.tsx
"use client"
import { HeroUIProvider } from "@heroui/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>
}

// app/layout.tsx (Server Component)
import { Providers } from "./providers"
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Import Paths
Every component supports two import paths:
- **Full bundle:** `import { Button } from "@heroui/react"` (default, simpler)
- **Individual package:** `import { Button } from "@heroui/button"` (for tree-shaking)

---

## 2. Theme & Custom Variants

### Theme Plugin
```ts
// tailwind.config.ts
import { heroui } from "@heroui/theme"

export default {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#BEF264", foreground: "#000000" },
            focus: "#BEF264",
          }
        },
        dark: {
          colors: {
            primary: { DEFAULT: "#7EE7F6", foreground: "#000000" },
          }
        }
      }
    })
  ]
}
```

### Nested Themes
```jsx
<div className="dark">
  <Card>Dark theme card</Card>
</div>
```

### Custom Variants — `extendVariants`
```jsx
import { extendVariants, Button } from "@heroui/react"

const MyButton = extendVariants(Button, {
  variants: {
    color: {
      olive: "text-[#000] bg-[#84cc16]",
      orange: "bg-[#ff6b2c] text-white",
    },
    isScalable: {
      true: "hover:scale-[1.1]",
    }
  },
  defaultVariants: {
    color: "olive",
  },
  compoundVariants: [
    {
      isScalable: true,
      color: "olive",
      class: "hover:opacity-80",
    }
  ]
})
```

---

## 3. Shared Props (All Components)

| Prop | Values | Notes |
|---|---|---|
| `size` | `sm` \| `md` \| `lg` | Default: `md` |
| `color` | `default` \| `primary` \| `secondary` \| `success` \| `warning` \| `danger` | Semantic tokens |
| `radius` | `none` \| `sm` \| `md` \| `lg` \| `full` | |
| `isDisabled` | `boolean` | |
| `disableAnimation` | `boolean` | |
| `classNames` | `Partial<Record<slot, string>>` | Slot-based class overrides |

**Event handlers:** Use `onPress` (React Aria) instead of `onClick` for interactive components (Button, Card, Link, etc.).

---

## 4. Button

**Import:** `import { Button, ButtonGroup } from "@heroui/react"`

```jsx
<Button color="primary" variant="solid" onPress={handleClick}>
  Click me
</Button>
```

### Variants
`solid` | `bordered` | `light` | `flat` | `faded` | `shadow` | `ghost`

### Key Props
| Prop | Notes |
|---|---|
| `variant` | Default: `solid` |
| `color` | Default: `default` |
| `isLoading` | Shows spinner, disables interaction |
| `isIconOnly` | Equal width/height for icon buttons |
| `startContent` / `endContent` | Icon slots |
| `spinnerPlacement` | `start` \| `end` |
| `as` | Polymorphic — `as={Link}` for Next.js links |
| `href` | Use with `as={Link}` for navigation buttons |
| `fullWidth` | `boolean` |

### Rules
- Use `onPress` not `onClick`.
- Use `isIconOnly` + `aria-label` for icon-only buttons.
- For navigation, use `as={NextLink} href="/path"` — do NOT wrap in `<Link>` tags.
- Use `ButtonGroup` to group related actions; pass shared props to the group.

---

## 5. Input

**Import:** `import { Input } from "@heroui/react"`

```jsx
<Input
  label="Email"
  type="email"
  variant="bordered"
  isInvalid={!!error}
  errorMessage={error}
/>
```

### Variants
`flat` (default) | `bordered` | `faded` | `underlined`

### Key Props
| Prop | Notes |
|---|---|
| `label` | Display label |
| `labelPlacement` | `inside` \| `outside` \| `outside-left` |
| `placeholder` | |
| `value` / `defaultValue` | Controlled / uncontrolled |
| `type` | Standard HTML input types |
| `isClearable` | Shows X button |
| `isInvalid` | Triggers error state |
| `errorMessage` | Shown when `isInvalid` |
| `description` | Helper text below input |
| `startContent` / `endContent` | Icon/text decorations |
| `isRequired` / `isReadOnly` / `isDisabled` | |

### Events
- `onChange` — native `React.ChangeEvent<HTMLInputElement>`
- `onValueChange(value: string)` — simplified string handler

---

## 6. Textarea

**Import:** `import { Textarea } from "@heroui/react"`

```jsx
<Textarea
  label="Description"
  variant="bordered"
  minRows={3}
  maxRows={8}
/>
```

### Key Props (beyond Input)
| Prop | Notes |
|---|---|
| `minRows` | Default: 3 |
| `maxRows` | Default: 8 |
| `disableAutosize` | Disable auto-grow |
| `cacheMeasurements` | Reuse height calculations |
| `onHeightChange(height, { rowHeight })` | Fires on resize |

- Auto-sizing powered by `react-textarea-autosize`.
- Same validation props as Input (`isInvalid`, `errorMessage`, `description`).

---

## 7. Select

**Import:** `import { Select, SelectItem, SelectSection } from "@heroui/react"`

```jsx
<Select label="Animal" selectionMode="single">
  <SelectItem key="cat">Cat</SelectItem>
  <SelectItem key="dog">Dog</SelectItem>
</Select>
```

### Key Props
| Prop | Notes |
|---|---|
| `selectionMode` | `single` \| `multiple` |
| `selectedKeys` / `defaultSelectedKeys` | Controlled / uncontrolled |
| `onSelectionChange` | Receives `Set<React.Key>` |
| `items` | Dynamic data array |
| `isLoading` | Shows spinner in list |
| `placeholder` | Shown when nothing selected |

### Dynamic + Async
```jsx
// Dynamic
<Select items={animals}>
  {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
</Select>

// Async (with useInfiniteScroll)
import { useInfiniteScroll } from "@heroui/use-infinite-scroll"
const [items, hasMore, loaderRef, scrollerRef] = useInfiniteScroll({ ...fetchConfig })
```

### Sections
```jsx
<Select>
  <SelectSection title="Mammals">
    <SelectItem key="cat">Cat</SelectItem>
  </SelectSection>
</Select>
```

---

## 8. Autocomplete

**Import:** `import { Autocomplete, AutocompleteItem, AutocompleteSection } from "@heroui/react"`

```jsx
<Autocomplete label="Search animal">
  <AutocompleteItem key="cat">Cat</AutocompleteItem>
  <AutocompleteItem key="dog">Dog</AutocompleteItem>
</Autocomplete>
```

### Key Props
| Prop | Notes |
|---|---|
| `allowsCustomValue` | Required to allow input not in list |
| `menuTrigger` | `focus` (default) \| `input` \| `manual` |
| `inputValue` / `onInputChange` | Controlled input text |
| `selectedKey` / `onSelectionChange` | Controlled selection |
| `isVirtualized` | Use for 100+ items |
| `itemHeight` | Default: 32 (for virtualization) |
| `maxListboxHeight` | Default: 256 |
| `defaultFilter` | Override built-in filter function |
| `filterOptions` | `Intl.CollatorOptions` — default: `{sensitivity:'base'}` |

---

## 9. Form

**Import:** `import { Form } from "@heroui/react"`

```jsx
<Form validationBehavior="native" onSubmit={handleSubmit}>
  <Input name="email" type="email" isRequired />
  <Button type="submit">Submit</Button>
</Form>
```

### Validation
- `validationBehavior`: `"native"` (browser) \| `"aria"` (React Aria)
- Server-side validation with Server Actions:

```jsx
// With useActionState
const [errors, formAction] = useActionState(createUser, {})
return (
  <Form validationErrors={errors} action={formAction}>
    <Input name="username" />
  </Form>
)
```

---

## 10. Checkbox & CheckboxGroup

**Import:** `import { Checkbox, CheckboxGroup } from "@heroui/react"`

```jsx
// Standalone
<Checkbox defaultSelected>Subscribe</Checkbox>

// Group
<CheckboxGroup label="Interests" defaultValue={["sports"]}>
  <Checkbox value="sports">Sports</Checkbox>
  <Checkbox value="music">Music</Checkbox>
</CheckboxGroup>
```

### Key Props
| Prop | Notes |
|---|---|
| `isSelected` / `defaultSelected` | Controlled / uncontrolled |
| `isIndeterminate` | Overrides user interaction |
| `lineThrough` | Strike-through label when selected |
| `icon` | Custom check icon |
| `onValueChange(isSelected: boolean)` | Simplified handler |

- Individual `<Checkbox>` inside `CheckboxGroup` must have a `value` prop.
- `CheckboxGroup` `orientation`: `"vertical"` (default) \| `"horizontal"`.

---

## 11. RadioGroup

**Import:** `import { RadioGroup, Radio } from "@heroui/react"`

```jsx
<RadioGroup label="Plan" defaultValue="free">
  <Radio value="free">Free</Radio>
  <Radio value="pro">Pro</Radio>
</RadioGroup>
```

### Key Props
| Prop | Notes |
|---|---|
| `value` / `defaultValue` | Single string value |
| `onValueChange(value: string)` | Simplified handler |
| `orientation` | `"vertical"` (default) \| `"horizontal"` |
| `isInvalid` / `errorMessage` | Validation |

- Single selection only (mutually exclusive).
- Arrow key navigation built in.
- `validationState` is deprecated — use `isInvalid`.

---

## 12. Switch

**Import:** `import { Switch } from "@heroui/react"`

```jsx
<Switch defaultSelected>Dark mode</Switch>
```

### Key Props
| Prop | Notes |
|---|---|
| `isSelected` / `defaultSelected` | Controlled / uncontrolled |
| `thumbIcon` | Icon inside thumb circle (e.g. sun/moon for dark mode) |
| `startContent` / `endContent` | Icons on left/right of track |
| `onValueChange(isSelected: boolean)` | Simplified handler |

```jsx
// Dark mode toggle pattern
<Switch
  thumbIcon={({ isSelected }) => isSelected ? <SunIcon /> : <MoonIcon />}
/>
```

---

## 13. Slider

**Import:** `import { Slider } from "@heroui/react"`

```jsx
// Single value
<Slider label="Volume" defaultValue={60} />

// Range (two thumbs) — pass array
<Slider label="Price Range" defaultValue={[20, 80]} />
```

### Key Props
| Prop | Notes |
|---|---|
| `value` / `defaultValue` | `number` or `number[]` for range mode |
| `minValue` / `maxValue` | Default: 0 / 100 |
| `step` | Default: 1 |
| `orientation` | `"horizontal"` (default) \| `"vertical"` |
| `showSteps` | Show step marks |
| `showTooltip` | Show value tooltip on thumb |
| `marks` | Custom labeled step marks |
| `fillOffset` | Starting point for fill visual |
| `onChange` | Fires continuously during drag |
| `onChangeEnd` | Fires once drag completes |

---

## 14. NumberInput

**Import:** `import { NumberInput } from "@heroui/react"`

```jsx
<NumberInput
  label="Quantity"
  defaultValue="1"
  minValue={0}
  maxValue={100}
/>
```

### Key Props
| Prop | Notes |
|---|---|
| `value` / `defaultValue` | **String type** (not number) |
| `onValueChange(value: number)` | Returns **number** — use for controlled state |
| `step` | Default: 1 |
| `minValue` / `maxValue` | Numeric constraints |
| `formatOptions` | `Intl.NumberFormatOptions` — supports currency, percent, unit |
| `hideStepper` | Hide +/- buttons |
| `isWheelDisabled` | Disable scroll-to-change (default: false) |

- `value` prop is `string` but `onValueChange` returns `number`.
- `errorMessage` only renders when `isInvalid={true}`.

---

## 15. Date & Time Components

**Required dependency:** `npm install @internationalized/date`

### Date Value Types
| Type | Use case |
|---|---|
| `CalendarDate` | Date only, no time, no timezone |
| `CalendarDateTime` | Date + time, no timezone |
| `ZonedDateTime` | Date + time + timezone (DST-aware) |
| `Time` | Time only (for TimeInput) |

### Granularity defaults
- `CalendarDate` → `day` (no time fields)
- `CalendarDateTime` / `ZonedDateTime` → `minute` (time fields shown)

### DatePicker
**Import:** `import { DatePicker } from "@heroui/react"`
```jsx
import { parseDate } from "@internationalized/date"
<DatePicker label="Birth date" defaultValue={parseDate("1995-11-20")} />
```

Key props: `minValue`, `maxValue`, `isDateUnavailable`, `visibleMonths` (max 3), `showMonthAndYearPickers` (disabled if `visibleMonths > 1`), `granularity`, `hourCycle` (`12`\|`24`), `CalendarTopContent`, `CalendarBottomContent`

### DateInput
**Import:** `import { DateInput } from "@heroui/react"`
```jsx
<DateInput label="Date" placeholderValue={new CalendarDate(1995, 11, 6)} />
```
- Keyboard-only segment editing — no calendar popover.
- Use `parseDate()`, `parseZonedDateTime()`, `parseAbsoluteToLocal()` for parsing.

### DateRangePicker
**Import:** `import { DateRangePicker } from "@heroui/react"`
```jsx
<DateRangePicker label="Stay" />
// value shape: { start: DateValue, end: DateValue }
```
- `allowsNonContiguousRanges` — allow ranges spanning unavailable dates.
- `startName` / `endName` for form field names.

### TimeInput
**Import:** `import { TimeInput } from "@heroui/react"`
```jsx
import { Time } from "@internationalized/date"
<TimeInput label="Appointment" defaultValue={new Time(11, 45)} />
```
- `granularity`: `"hour"` \| `"minute"` (default) \| `"second"`
- `hourCycle`: `12` \| `24`
- `hideTimeZone` — suppress timezone display for `ZonedDateTime`

### Calendar
**Import:** `import { Calendar } from "@heroui/react"`
```jsx
<Calendar defaultValue={today(getLocalTimeZone())} />
```
- `focusedValue` — controls which month is displayed.
- `topContent` / `bottomContent` — for preset date buttons.
- `createCalendar` — tree-shake unused calendar systems.

### RangeCalendar
**Import:** `import { RangeCalendar } from "@heroui/react"`
```jsx
<RangeCalendar defaultValue={{ start: start, end: end }} />
```
- `onChange` receives `RangeValue<DateValue> | null`.

---

## 16. Modal

**Import:** `import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react"`

```jsx
export default function Page() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  return (
    <>
      <Button onPress={onOpen}>Open</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Title</ModalHeader>
              <ModalBody>Content</ModalBody>
              <ModalFooter>
                <Button onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
```

### Rules
- **Always use `useDisclosure` hook** — provides `isOpen`, `onOpen`, `onClose`, `onOpenChange`.
- **`ModalContent` uses render prop pattern** — children is a function `(onClose) => ReactNode`.
- `isDismissable` (default: `true`) — click outside to close.
- `scrollBehavior`: `"inside"` (body scrolls) \| `"outside"` (page scrolls).
- Sizes: `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `5xl` \| `full`.

---

## 17. Dropdown

**Import:** `import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/react"`

```jsx
<Dropdown>
  <DropdownTrigger>
    <Button>Open</Button>
  </DropdownTrigger>
  <DropdownMenu
    selectionMode="single"
    onAction={(key) => console.log(key)}
  >
    <DropdownItem key="edit">Edit</DropdownItem>
    <DropdownItem key="delete" color="danger">Delete</DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### Key Props
| Prop | Notes |
|---|---|
| `selectionMode` | `"none"` \| `"single"` \| `"multiple"` (on DropdownMenu) |
| `closeOnSelect` | Default: `true`; set `false` for multiple selection |
| `selectedKeys` / `onSelectionChange` | Controlled selection |
| `disabledKeys` | Disable specific items |

---

## 18. Card

**Import:** `import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react"`

```jsx
<Card>
  <CardHeader><p>Title</p></CardHeader>
  <CardBody><p>Content</p></CardBody>
  <CardFooter><Button>Action</Button></CardFooter>
</Card>
```

### Key Props
| Prop | Notes |
|---|---|
| `isPressable` | Makes card clickable — use `onPress` callback |
| `isHoverable` | Adds hover effect without press behavior |
| `isBlurred` | Backdrop blur effect |
| `shadow` | `none` \| `sm` \| `md` \| `lg` |

- Use `onPress` (not `onClick`) when `isPressable={true}`.
- Sub-components are optional — omit unused slots.

---

## 19. Navbar

**Import:** `import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/react"`

```jsx
<Navbar>
  <NavbarBrand><Logo /></NavbarBrand>
  <NavbarContent className="hidden sm:flex gap-4" justify="center">
    <NavbarItem>
      <Link href="/about">About</Link>
    </NavbarItem>
  </NavbarContent>
  <NavbarContent justify="end">
    <NavbarItem>
      <Button as={Link} href="/login">Login</Button>
    </NavbarItem>
  </NavbarContent>
</Navbar>
```

### Key Props
| Prop | Notes |
|---|---|
| `position` | `"static"` \| `"sticky"` \| `"floating"` |
| `isBlurred` | Default: `true` — backdrop blur |
| `isBordered` | Bottom border |
| `isMenuOpen` / `onMenuOpenChange` | Controlled mobile menu |
| `maxWidth` | `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `full` |

### Rules
- Responsive: use `className="hidden sm:flex"` on `NavbarContent` for desktop-only items.
- Mobile menu: use `NavbarMenuToggle` + `NavbarMenu` with `NavbarMenuItem` children.
- Always pair `NavbarMenuToggle` with a controlled `isMenuOpen` + `onMenuOpenChange` for accessibility.

---

## 20. Table

**Import:** `import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react"`

```jsx
<Table selectionMode="multiple" aria-label="Users table">
  <TableHeader>
    <TableColumn key="name" allowsSorting>Name</TableColumn>
    <TableColumn key="email">Email</TableColumn>
  </TableHeader>
  <TableBody items={users}>
    {(user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
```

### Key Props
| Prop | Notes |
|---|---|
| `selectionMode` | `"none"` \| `"single"` \| `"multiple"` |
| `selectedKeys` / `onSelectionChange` | Controlled selection |
| `sortDescriptor` / `onSortChange` | Controlled sorting |
| `isVirtualized` | Use for large datasets |
| `topContent` / `bottomContent` | Slots for filters/pagination |

- `allowsSorting` on `TableColumn` enables sort icon.
- Add pagination by placing `<Pagination>` in `bottomContent`.
- `selectionBehavior`: `"toggle"` (default) \| `"replace"`.

---

## 21. Listbox

**Import:** `import { Listbox, ListboxItem, ListboxSection } from "@heroui/react"`

```jsx
<Listbox
  selectionMode="single"
  onAction={(key) => console.log(key)}
>
  <ListboxItem key="new">New file</ListboxItem>
  <ListboxItem key="delete" color="danger">Delete</ListboxItem>
</Listbox>
```

### Key Props
| Prop | Notes |
|---|---|
| `selectionMode` | `"none"` \| `"single"` \| `"multiple"` |
| `isVirtualized` | TanStack Virtual — supports 10,000+ items |
| `virtualization` | `{ maxListboxHeight, itemHeight }` |
| `onAction(key)` | Item activated |
| `emptyContent` | Default: `"No items."` |

- `ListboxItem` with `href` renders as a link.
- Sections without titles need `aria-label`.

---

## 22. Accordion

**Import:** `import { Accordion, AccordionItem } from "@heroui/react"`

```jsx
<Accordion>
  <AccordionItem key="1" title="Section 1">
    Content 1
  </AccordionItem>
  <AccordionItem key="2" title="Section 2">
    Content 2
  </AccordionItem>
</Accordion>
```

### Key Props
| Prop | Notes |
|---|---|
| `variant` | `"light"` (default) \| `"shadow"` \| `"bordered"` \| `"splitted"` |
| `selectionMode` | `"single"` (default) \| `"multiple"` |
| `selectedKeys` / `defaultSelectedKeys` | `"all"` or `React.Key[]` |
| `disallowEmptySelection` | Prevent closing all items |
| `keepContentMounted` | Keep DOM mounted when closed (prevents form state loss) |
| `motionProps` | Framer Motion config for animation |

- `indicator` on `AccordionItem` accepts a function: `({ isOpen, isDisabled }) => ReactNode`.
- `HeadingComponent` on `AccordionItem` defaults to `"h2"` — override for correct heading hierarchy.

---

## 23. Tabs

**Import:** `import { Tabs, Tab } from "@heroui/react"`

```jsx
<Tabs defaultSelectedKey="photos">
  <Tab key="photos" title="Photos">
    <p>Photos content</p>
  </Tab>
  <Tab key="videos" title="Videos">
    <p>Videos content</p>
  </Tab>
</Tabs>
```

### Key Props
| Prop | Notes |
|---|---|
| `variant` | `"solid"` (default) \| `"bordered"` \| `"light"` \| `"underlined"` |
| `placement` | `"top"` (default) \| `"bottom"` \| `"start"` \| `"end"` |
| `isVertical` | Overrides `placement` when true |
| `destroyInactiveTabPanel` | Default: `true` — set `false` to keep panels mounted |
| `keyboardActivation` | `"automatic"` (default) \| `"manual"` |
| `selectedKey` / `onSelectionChange` | Controlled |

- Link tabs: `<Tab key="/" href="/">` — sync `selectedKey` with `usePathname()` for Next.js.
- `destroyInactiveTabPanel={false}` prevents form state loss on tab switch.

---

## 24. Pagination

**Import:** `import { Pagination } from "@heroui/react"`

```jsx
// Uncontrolled
<Pagination total={10} initialPage={1} />

// Controlled
<Pagination total={10} page={page} onChange={setPage} />
```

### Key Props
| Prop | Notes |
|---|---|
| `total` | Required — total page count |
| `page` / `initialPage` | Controlled / uncontrolled |
| `onChange(page: number)` | Page change handler |
| `showControls` | Show prev/next arrows |
| `loop` | Wrap around at boundaries |
| `siblings` | Pages on each side of current (default: 1) |
| `boundaries` | Pages at start/end (default: 1) |
| `variant` | `"flat"` \| `"bordered"` \| `"light"` \| `"faded"` |

---

## 25. Avatar & AvatarGroup

**Import:** `import { Avatar, AvatarGroup, AvatarIcon } from "@heroui/react"`

```jsx
<Avatar src="/user.jpg" name="John Doe" />
<Avatar name="John Doe" /> // Shows initials if no src
```

### Key Props
| Prop | Notes |
|---|---|
| `src` | Image URL |
| `name` | Generates initials + deterministic bg color on image failure |
| `showFallback` | **Must be `true`** for fallback to show — NOT default |
| `fallback` | Custom fallback component |
| `isBordered` | |
| `isFocusable` | Set `true` when used as interactive element |
| `ImgComponent` | Custom image element (e.g., `next/image`) |

### AvatarGroup
```jsx
<AvatarGroup max={3} renderCount={(count) => <span>+{count} more</span>}>
  <Avatar src="..." />
  <Avatar src="..." />
</AvatarGroup>
```

- `max` — maximum visible avatars (default: 5).
- `isGrid` — grid layout instead of overlap.
- `renderCount` — custom overflow count element.

---

## 26. Badge

**Import:** `import { Badge } from "@heroui/react"`

```jsx
<Badge content="5" color="danger">
  <NotificationIcon />
</Badge>
```

### Key Props
| Prop | Notes |
|---|---|
| `content` | Badge text/number |
| `variant` | `"solid"` (default) \| `"flat"` \| `"faded"` \| `"shadow"` |
| `placement` | `"top-right"` (default) \| `"top-left"` \| `"bottom-right"` \| `"bottom-left"` |
| `shape` | `"rectangle"` (default) \| `"circle"` |
| `isOneChar` | Forces equal width/height for single-digit numbers |
| `isDot` | Dot-style badge with no content |
| `isInvisible` | Hidden state |
| `showOutline` | Default: `true` (replaces deprecated `disableOutline`) |

- Do NOT rely on badge content for screen reader announcements — use `aria-label` on parent.

---

## 27. Chip

**Import:** `import { Chip } from "@heroui/react"`

```jsx
<Chip color="primary">Active</Chip>
<Chip onClose={() => remove(id)}>Removable</Chip>
```

### Key Props
| Prop | Notes |
|---|---|
| `variant` | `"solid"` \| `"bordered"` \| `"light"` \| `"flat"` \| `"faded"` \| `"shadow"` \| **`"dot"`** (unique to Chip) |
| `onClose` | Adding this prop auto-shows close button |
| `startContent` / `endContent` | Icon slots |
| `avatar` | Avatar component for user chips |

---

## 28. Tooltip

**Import:** `import { Tooltip } from "@heroui/react"`

```jsx
<Tooltip content="This is a tooltip" placement="top" showArrow>
  <Button>Hover me</Button>
</Tooltip>
```

### Key Props
| Prop | Notes |
|---|---|
| `content` | Tooltip content |
| `placement` | 12 options: `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, `right-end` |
| `showArrow` | Show arrow indicator |
| `delay` | Open delay in ms |
| `closeDelay` | Close delay in ms |
| `isDisabled` | |

---

## 29. Progress

**Import:** `import { Progress } from "@heroui/react"`

```jsx
<Progress value={60} label="Loading" showValueLabel />
<Progress isIndeterminate label="Processing" />
```

### Key Props
| Prop | Notes |
|---|---|
| `value` | Current value |
| `minValue` / `maxValue` | Default: 0 / 100 |
| `isIndeterminate` | Looping animation when duration unknown |
| `isStriped` | Striped fill |
| `showValueLabel` | Default: `true` |
| `valueLabel` | Custom label (e.g., `"1 of 4"`) |
| `formatOptions` | `Intl.NumberFormat` options — default: `{style: 'percent'}` |

- Requires `label` or `aria-label` for accessibility.

---

## 30. Skeleton

**Import:** `import { Skeleton } from "@heroui/react"`

```jsx
// With children — reveals content when loaded
<Skeleton isLoaded={isLoaded}>
  <div className="w-32 h-8">Actual content</div>
</Skeleton>

// Standalone placeholder
<Skeleton className="w-48 h-6 rounded-lg" />
```

### Key Props
| Prop | Notes |
|---|---|
| `isLoaded` | `false` (default) = show skeleton; `true` = reveal content |
| `disableAnimation` | |

---

## 31. Spinner

**Import:** `import { Spinner } from "@heroui/react"`

```jsx
<Spinner />
<Spinner label="Loading..." color="warning" variant="dots" />
```

### Key Props
| Prop | Notes |
|---|---|
| `variant` | `"default"` \| `"simple"` \| `"gradient"` \| `"wave"` \| `"dots"` \| `"spinner"` |
| `label` | Accessible label (also renders visible text) |
| `labelColor` | Independent color for label text |

- Default `aria-label="Loading"` — override with `label` or `aria-label`.

---

## 32. Link

**Import:** `import { Link } from "@heroui/react"`

```jsx
<Link href="/about" color="primary" underline="hover">About</Link>
<Link href="https://example.com" isExternal showAnchorIcon>External</Link>
```

### Key Props
| Prop | Notes |
|---|---|
| `underline` | `"none"` (default) \| `"hover"` \| `"always"` \| `"active"` \| `"focus"` |
| `isExternal` | Auto-adds `target="_blank"` + security `rel` attributes |
| `showAnchorIcon` | Shows external link indicator |
| `isBlock` | Block-level with hover background |
| `as` | Polymorphic — `as={NextLink}` for Next.js |

- Use `onPress` not `onClick`.

---

## 33. Breadcrumbs

**Import:** `import { Breadcrumbs, BreadcrumbItem } from "@heroui/react"`

```jsx
<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/music">Music</BreadcrumbItem>
  <BreadcrumbItem>Album</BreadcrumbItem>
</Breadcrumbs>
```

### Key Props
| Prop | Notes |
|---|---|
| `variant` | `"solid"` (default) \| `"bordered"` \| `"light"` |
| `maxItems` | Collapse with ellipsis when exceeded |
| `itemsBeforeCollapse` / `itemsAfterCollapse` | Items to show around ellipsis |
| `separator` | Custom separator |

- Last item automatically receives `aria-current`.
- Compatible with Next.js Link via `as` prop on `BreadcrumbItem`.

---

## 34. Image

**Import:** `import { Image } from "@heroui/react"`

```jsx
<Image src="/hero.jpg" alt="Hero image" width={500} height={300} />
<Image src="/img.jpg" alt="Blurred" isBlurred />
<Image src="/img.jpg" alt="Zoomed" isZoomed />
```

### Key Props
| Prop | Notes |
|---|---|
| `radius` | Default: `"lg"` |
| `shadow` | `"none"` (default) \| `"sm"` \| `"md"` \| `"lg"` |
| `isBlurred` | Renders blurred duplicate behind image |
| `isZoomed` | Zoom animation on hover |
| `fallbackSrc` | Fallback URL on error |
| `disableSkeleton` | Disable loading skeleton |
| `removeWrapper` | Disables skeleton + zoom — avoid if you need those |

- **Client Component** — uses `useState` internally.
- Compatible with Next.js `<Image>` via `as` prop.

---

## 35. Divider

**Import:** `import { Divider } from "@heroui/react"`

```jsx
<Divider />
<Divider orientation="vertical" />
```

- `orientation`: `"horizontal"` (default) \| `"vertical"`
- **Server Component** — no `"use client"` needed.
- Renders with `role="separator"`.

---

## 36. User

**Import:** `import { User } from "@heroui/react"`

```jsx
<User
  name="Jane Doe"
  description="Product Designer"
  avatarProps={{ src: "/avatar.jpg" }}
/>
```

- `description` accepts `ReactNode` — links, badges are valid.
- `isFocusable={true}` when used as a Dropdown trigger.

---

## 37. ScrollShadow

**Import:** `import { ScrollShadow } from "@heroui/react"`

```jsx
<ScrollShadow className="max-h-64">
  {/* Long content */}
</ScrollShadow>
```

### Key Props
| Prop | Notes |
|---|---|
| `size` | Shadow size in pixels (default: 40) |
| `offset` | Scroll distance before shadow appears (default: 0) |
| `hideScrollBar` | Hide native scrollbar |
| `orientation` | `"vertical"` (default) \| `"horizontal"` |
| `visibility` | Controlled: `"auto"` \| `"top"` \| `"bottom"` \| `"both"` \| `"none"` |

---

## 38. Code

**Import:** `import { Code } from "@heroui/react"`

```jsx
<Code color="primary">npm install @heroui/react</Code>
```

- For inline code snippets (not code blocks).
- **Server Component** — no `"use client"` needed.
- Props: `size` (default: `"sm"`), `color`, `radius` (default: `"sm"`).

---

## 39. Kbd

**Import:** `import { Kbd } from "@heroui/react"`

```jsx
<Kbd keys={["command"]}>K</Kbd>
<Kbd keys={["command", "shift"]}>N</Kbd>
```

- `keys` accepts `KbdKey[]`: `"command"`, `"shift"`, `"ctrl"`, `"option"`, `"enter"`, `"delete"`, `"escape"`, `"tab"`, `"capslock"`, arrow keys, `"space"`, `"fn"`, `"win"`, `"alt"`, etc.
- `children` — the final key character.
- **Server Component** — no `"use client"` needed.

---

## 40. Spacer

**Import:** `import { Spacer } from "@heroui/react"`

```jsx
<Spacer y={4} />  {/* h-4 */}
<Spacer x={2} />  {/* w-2 */}
```

- `x` / `y` — Tailwind spacing scale values (default: `"1"`).
- **Server Component** — no `"use client"` needed.
- Prefer CSS `gap` over `<Spacer>` in flex/grid layouts when possible.

---

## Accessibility Rules (All Components)

1. **Always provide `aria-label`** when visible text is absent (icon buttons, standalone avatars, progress bars).
2. **Badge content** must NOT be the only way to convey information — also use `aria-label` on the parent.
3. **Sections without titles** (in Listbox, Dropdown, Select) need `aria-label`.
4. **`Avatar`** requires `name` or `alt`-equivalent for screen readers.
5. **`Progress`** requires either `label` or `aria-label`.
6. **`isInvalid` + `errorMessage`** — always provide error messages with `isInvalid` state.

---

## Server vs Client Component Reference

| Component | Server Component? |
|---|---|
| Divider, Code, Kbd, Spacer | ✅ Server Component |
| Most interactive components (Button, Input, Modal, etc.) | ❌ Requires Client Component context |
| Image | ❌ Client Component |
| Skeleton | ❌ Client Component (animation state) |

- Server Components CAN render HeroUI Client Components as children.
- Do NOT add `"use client"` to pages/layouts that contain HeroUI — the components handle this boundary themselves.
