# Components

This folder contains reusable UI components following **Atomic Design** principles. Components here are **presentational only** and should not contain business logic or make network calls.

## 🧪 Atomic Design Structure

### **Atoms** (`atoms/`)
Basic building blocks that can't be broken down further:
- `Button` - All button variants with loading states, icons
- `Input` - Form inputs with validation states, icons
- `Icon` - Consistent icon system with size variants

### **Molecules** (`molecules/`) 
Simple combinations of atoms that form functional components:
- `FormField` - Input + validation + label combo
- `SearchBar` - Input + Button + clear functionality

### **Organisms** (`organisms/`)
Complex UI components made of molecules and atoms:
- Coming soon...

### **Templates** (`templates/`)
Page-level layouts without specific content:
- Coming soon...

## 📦 Usage Examples

### Import Components:
```tsx
import { Button, Input, Icon } from '@/components';
import { FormField, SearchBar } from '@/components';
```

### Basic Usage:
```tsx
// Button with icon
<Button 
  variant="primary" 
  icon={<Icon name="upload" />}
  loading={isLoading}
>
  Upload Document
</Button>

// Form field with validation
<FormField
  name="email"
  label="Email Address"
  type="email"
  validation={{ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }}
  value={email}
  onChange={handleEmailChange}
/>

// Search bar
<SearchBar
  placeholder="Search documents..."
  onSearch={handleSearch}
  loading={isSearching}
/>
```

## 🎨 Design Tokens

Components use consistent design tokens:
- **Colors**: Primary (#3b82f6), Secondary (#6b7280), Success (#10b981), Warning (#f59e0b), Danger (#ef4444)
- **Sizes**: Small, Medium, Large
- **Spacing**: 0.25rem increments
- **Border Radius**: 0.375rem, 0.5rem

## ✅ Component Guidelines

1. **Presentational Only**: No business logic, API calls, or state management
2. **Reusable**: Should work across different features
3. **Accessible**: Include proper ARIA labels and keyboard support
4. **Typed**: Full TypeScript support with exported interfaces
5. **Documented**: Each component has props documentation

## 🔄 Adding New Components

1. Create folder: `src/components/atoms/MyAtom/`
2. Add files: `MyAtom.tsx`, `MyAtom.css`
3. Export from: `atoms/index.ts` and `components/index.ts`
4. Follow existing patterns for props and styling
