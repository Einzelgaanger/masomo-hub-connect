# LoadingSpinner Component

A clean, simple loading spinner component with multiple variants and sizes for consistent loading states across the application.

## Features

- **Simple Design**: Clean, minimal spinner without complex animations
- **Multiple Variants**: `default`, `minimal`, `fullscreen`
- **Flexible Sizes**: `sm`, `md`, `lg`
- **Customizable Messages**: Optional loading messages
- **Consistent Styling**: Matches the application's design system
- **Accessibility**: Screen reader friendly

## Usage

### Fullscreen Loading
```tsx
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Fullscreen loading (for page transitions)
<LoadingSpinner 
  message="Loading dashboard..." 
  variant="fullscreen" 
  size="lg" 
/>
```

### Default Loading
```tsx
// Default loading (for content areas)
<LoadingSpinner 
  message="Loading data..." 
  variant="default" 
  size="md" 
/>
```

### Minimal Loading
```tsx
// Minimal loading (for inline content)
<LoadingSpinner 
  message="Saving..." 
  variant="minimal" 
  size="sm" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `"Loading..."` | Loading message to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the spinner |
| `variant` | `'default' \| 'minimal' \| 'fullscreen'` | `'default'` | Visual variant |
| `className` | `string` | `undefined` | Additional CSS classes |

## Variants

### Default
- Centered spinner with message
- Clean white background
- Best for content areas and modals

### Minimal
- Horizontal layout with spinner and message
- No background or border
- Best for inline loading states

### Fullscreen
- Full screen overlay
- Clean white background
- Best for page transitions and initial loading

## Examples

### Page Loading
```tsx
const MyPage = () => {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <LoadingSpinner message="Loading page..." variant="fullscreen" />;
  }
  
  return <div>Page content</div>;
};
```

### Button Loading State
```tsx
const MyButton = () => {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button disabled={loading}>
      {loading ? (
        <LoadingSpinner variant="minimal" size="sm" message="" />
      ) : (
        'Submit'
      )}
    </Button>
  );
};
```

### Inline Content Loading
```tsx
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  
  return (
    <div>
      <h2>Content</h2>
      {loading ? (
        <LoadingSpinner message="Loading content..." variant="default" size="md" />
      ) : (
        <div>Actual content</div>
      )}
    </div>
  );
};
```