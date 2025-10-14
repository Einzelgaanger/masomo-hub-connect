# Bunifu - The University Ecosystem

The complete university platform where students learn, connect, and launch careers. The only platform that connects your entire university experience with gamified learning, real-time collaboration, and direct access to employers.

## 🎯 Features

### For Students
- **Gamified Learning Experience**: Earn points for various activities and climb the ranks
- **Unit-Based Navigation**: Access notes, past papers, assignments, and events for each unit
- **Social Learning**: Like, dislike, and comment on shared content
- **File Sharing**: Upload and download study materials (PDFs, images, documents)
- **Assignment Tracking**: Mark assignments as complete and track deadlines
- **Wall of Fame**: See top performers in your university
- **Daily Rewards**: Earn points for daily visits and engagement

### For Administrators
- **Class Management**: Create and manage classes with units
- **Student Management**: Add students individually or in bulk
- **Content Management**: Create announcements and manage university-wide content
- **Role Management**: Assign roles (student, lecturer, admin, super_admin)
- **Analytics Dashboard**: View statistics and performance metrics

### Gamification System
- **Point System**: Earn points for various activities
  - Upload notes: 10 points
  - Upload past papers: 15 points
  - Complete assignments: 20 points
  - Like content: 2 points
  - Comment on content: 3 points
  - Daily visit: 5 points
- **Rank System**: Bronze → Silver → Gold → Platinum → Diamond
- **Real-time Leaderboards**: Track progress against peers

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd masomo-hub-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations from `supabase/migrations/`
   - Configure authentication settings
   - Set up storage buckets for file uploads

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase URL and anon key to the environment file.

5. **Start the development server**
   ```bash
npm run dev
```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Supabase** for backend services
- **PostgreSQL** database
- **Row Level Security (RLS)** for data protection
- **Supabase Storage** for file uploads
- **Supabase Auth** for authentication

### Database Schema
- **Users & Profiles**: User management with roles and gamification
- **Universities & Classes**: Hierarchical organization
- **Units**: Course-specific content organization
- **Uploads**: File sharing with social features
- **Assignments & Events**: Academic scheduling
- **Comments & Reactions**: Social interaction system

## 📱 User Roles

### Student
- Access unit-specific content
- Upload and download files
- Participate in social features
- Track assignments and events
- View gamification progress

### Lecturer
- All student features
- Create assignments and events
- Moderate content (delete inappropriate posts)
- Access class-specific analytics

### Admin
- All lecturer features
- Manage classes and units
- Add/remove students
- Create announcements
- Access university-wide analytics

### Super Admin
- All admin features
- Manage universities and countries
- System-wide configuration
- Full platform access

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access Control**: UI and API restrictions
- **File Upload Validation**: Secure file handling
- **Authentication**: Secure user management
- **Data Isolation**: Users only see relevant content

## 📊 Key Components

### Dashboard
- Welcome section with user stats
- Announcements feed
- Wall of Fame
- Upcoming assignments and events
- Gamification progress

### Unit Pages
- **Notes Tab**: File sharing with social features
- **Past Papers Tab**: Exam preparation materials
- **Assignments Tab**: Assignment management with deadlines
- **Events Tab**: Academic calendar and reminders

### Admin Panel
- **Class Management**: Create and organize classes
- **Student Management**: Bulk import and individual management
- **Content Management**: University announcements
- **Analytics**: Performance metrics and statistics

## 🎮 Gamification Details

### Point System
- **Content Creation**: Higher points for sharing valuable resources
- **Social Engagement**: Points for community interaction
- **Consistency**: Daily visit bonuses encourage regular use
- **Achievement**: Assignment completion rewards

### Rank Progression
- **Bronze Scholar** (0-499 points): Starting your academic journey
- **Silver Scholar** (500-1,999 points): Building your knowledge base
- **Gold Scholar** (2,000-4,999 points): Excelling in your studies
- **Platinum Scholar** (5,000-9,999 points): Mastering your field
- **Diamond Scholar** (10,000+ points): Academic excellence achieved

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

### Supabase Production Setup
1. Create production Supabase project
2. Run database migrations
3. Configure authentication providers
4. Set up custom domains
5. Configure storage policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app development
- Real-time notifications
- Advanced analytics
- Integration with learning management systems
- AI-powered content recommendations
- Video content support
- Offline functionality

---

**Bunifu** - Transforming education through technology and gamification! 🎓✨