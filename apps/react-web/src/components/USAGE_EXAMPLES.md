# 🧪 Complete Atomic Design System Usage Examples

## 🔧 Import Everything You Need

```tsx
import { 
  // Atoms
  Button, Input, Icon, Badge, Avatar, Link,
  // Molecules  
  FormField, SearchBar, Card, Navigation
} from '@/components';
```

## 🎯 **Real ApexFlow Examples**

### **1. Document Card**
```tsx
<Card variant="elevated" hoverable className="document-card">
  <Card.Header>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Icon name="document" />
      <h3>Contract_2024.pdf</h3>
      <Badge variant="success" size="small">Processed</Badge>
    </div>
  </Card.Header>
  
  <Card.Body>
    <p>Legal contract for vendor services...</p>
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <Badge variant="info" outline>4.2 MB</Badge>
      <Badge variant="default" outline>2 hours ago</Badge>
    </div>
  </Card.Body>
  
  <Card.Footer>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button variant="ghost" size="small" icon={<Icon name="view" />}>
        View
      </Button>
      <Button variant="ghost" size="small" icon={<Icon name="download" />}>
        Download
      </Button>
      <Button variant="primary" size="small" icon={<Icon name="share" />}>
        Share
      </Button>
    </div>
  </Card.Footer>
</Card>
```

### **2. ApexFlow Sidebar Navigation**
```tsx
<Navigation variant="vertical">
  <Navigation.Group title="Main">
    <Navigation.Item 
      to="/dashboard" 
      icon={<Icon name="gear" />}
      badge={3}
      badgeVariant="primary"
    >
      Dashboard
    </Navigation.Item>
    <Navigation.Item 
      to="/upload" 
      icon={<Icon name="upload" />}
    >
      Upload
    </Navigation.Item>
    <Navigation.Item 
      to="/documents" 
      icon={<Icon name="folder" />}
      badge="152"
      badgeVariant="info"
    >
      Documents
    </Navigation.Item>
  </Navigation.Group>

  <Navigation.Group title="AI Tools" collapsible>
    <Navigation.Item 
      to="/workflows" 
      icon={<Icon name="lightning" />}
      badge="8"
      badgeVariant="warning"
    >
      Workflows
    </Navigation.Item>
    <Navigation.Item 
      to="/search" 
      icon={<Icon name="search" />}
    >
      AI Search
    </Navigation.Item>
    <Navigation.Item 
      to="/chat" 
      icon={<Icon name="chat" />}
      badge="New"
      badgeVariant="success"
    >
      Document Chat
    </Navigation.Item>
  </Navigation.Group>
</Navigation>
```

### **3. User Profile Header**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
  <Avatar 
    name="John Doe" 
    src="/avatar.jpg" 
    size="large" 
    status="online" 
  />
  
  <div>
    <h2>Welcome back, John!</h2>
    <p>
      <Badge variant="primary" dot>Pro Plan</Badge>
      <Link to="/profile" variant="muted" size="small">
        Manage Account
      </Link>
    </p>
  </div>
  
  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
    <Button variant="ghost" icon={<Icon name="notification" />} />
    <Button variant="ghost" icon={<Icon name="settings" />} />
  </div>
</div>
```

### **4. Document Upload Form**
```tsx
<Card>
  <Card.Header>
    <h2>Upload Documents</h2>
    <p>Upload files for AI-powered processing</p>
  </Card.Header>
  
  <Card.Body>
    <FormField
      name="title"
      label="Document Title"
      placeholder="Enter document title..."
      validation={{ required: true, minLength: 3 }}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      leftIcon={<Icon name="document" />}
    />
    
    <FormField
      name="description"  
      label="Description"
      placeholder="Brief description..."
      helperText="Help AI understand your document better"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
    
    <SearchBar
      placeholder="Search for similar documents..."
      onSearch={handleSearchSimilar}
      loading={searchLoading}
      showButton={false}
    />
  </Card.Body>
  
  <Card.Footer>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button variant="ghost">Cancel</Button>
      <Button 
        variant="primary" 
        loading={uploading}
        icon={<Icon name="upload" />}
      >
        Upload & Process
      </Button>
    </div>
  </Card.Footer>
</Card>
```

### **5. Status Dashboard**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
  <Card variant="elevated">
    <Card.Body>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Icon name="document" size="large" color="#3b82f6" />
        <div>
          <h3>152</h3>
          <p>Documents Processed</p>
          <Badge variant="success" size="small">+12 this week</Badge>
        </div>
      </div>
    </Card.Body>
  </Card>

  <Card variant="elevated">
    <Card.Body>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Icon name="lightning" size="large" color="#f59e0b" />
        <div>
          <h3>8</h3>
          <p>Active Workflows</p>
          <Badge variant="warning" size="small" dot>Processing</Badge>
        </div>
      </div>
    </Card.Body>
  </Card>

  <Card variant="elevated">
    <Card.Body>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Icon name="check" size="large" color="#10b981" />
        <div>
          <h3>99.2%</h3>
          <p>Accuracy Rate</p>
          <Badge variant="success" outline size="small">Excellent</Badge>
        </div>
      </div>
    </Card.Body>
  </Card>
</div>
```

### **6. Action Buttons with Status**
```tsx
<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
  <Button variant="primary" icon={<Icon name="plus" />}>
    Create Workflow
  </Button>
  
  <Button 
    variant="secondary" 
    icon={<Icon name="upload" />}
    loading={uploading}
  >
    Bulk Upload
  </Button>
  
  <Button variant="danger" size="small" icon={<Icon name="delete" />}>
    Delete Selected
  </Button>
  
  <Badge variant="info" size="large">
    24 items selected
  </Badge>
</div>
```

## 🎨 **Component Combinations**

Every component is designed to work together perfectly:

- **Atoms**: `Button`, `Input`, `Icon`, `Badge`, `Avatar`, `Link`
- **Molecules**: `FormField`, `SearchBar`, `Card`, `Navigation`  
- **Future Organisms**: `Modal`, `DataTable`, `FileUploader`, `ChatInterface`

## ✨ **Benefits**

1. **Consistent UI** - Same look everywhere
2. **Type Safe** - Full TypeScript support  
3. **Accessible** - Built-in ARIA support
4. **Themeable** - Easy to customize colors/sizes
5. **Composable** - Mix and match freely
6. **Maintainable** - Change once, updates everywhere

Your entire ApexFlow app now has a **professional, consistent design system**! 🚀
