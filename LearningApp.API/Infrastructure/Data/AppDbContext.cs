using Microsoft.EntityFrameworkCore;
using LearningApp.API.Domain.Entities;

namespace LearningApp.API.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<Lesson> Lessons => Set<Lesson>();
        public DbSet<LessonMaterial> LessonMaterials => Set<LessonMaterial>();
        public DbSet<Quiz> Quizzes => Set<Quiz>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<Result> Results => Set<Result>();
        public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<Certificate> Certificates => Set<Certificate>();
        public DbSet<Notification> Notifications => Set<Notification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(e =>
            {
                e.HasKey(u => u.Id);
                e.HasIndex(u => u.Email).IsUnique();
                e.Property(u => u.Role).HasDefaultValue("Student");
            });

            // Course
            modelBuilder.Entity<Course>(e =>
            {
                e.HasKey(c => c.Id);
                e.Property(c => c.Price).HasPrecision(18, 2);
            });

            // Enrollment
            modelBuilder.Entity<Enrollment>(e =>
            {
                e.HasKey(en => en.Id);
                e.HasIndex(en => new { en.UserId, en.CourseId }).IsUnique();
                e.HasOne(en => en.User)
                    .WithMany(u => u.Enrollments)
                    .HasForeignKey(en => en.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(en => en.Course)
                    .WithMany(c => c.Enrollments)
                    .HasForeignKey(en => en.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Lesson
            modelBuilder.Entity<Lesson>(e =>
            {
                e.HasKey(l => l.Id);
                e.HasOne(l => l.Course)
                    .WithMany(c => c.Lessons)
                    .HasForeignKey(l => l.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasMany(l => l.Materials)
                    .WithOne(m => m.Lesson)
                    .HasForeignKey(m => m.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasMany(l => l.Quizzes)
                    .WithOne(q => q.Lesson)
                    .HasForeignKey(q => q.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // LessonMaterial
            modelBuilder.Entity<LessonMaterial>(e =>
            {
                e.HasKey(m => m.Id);
            });

            // Quiz
            modelBuilder.Entity<Quiz>(e =>
            {
                e.HasKey(q => q.Id);
            });

            // Question
            modelBuilder.Entity<Question>(e =>
            {
                e.HasKey(q => q.Id);
                e.HasOne(q => q.Quiz)
                    .WithMany(qz => qz.Questions)
                    .HasForeignKey(q => q.QuizId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Result
            modelBuilder.Entity<Result>(e =>
            {
                e.HasKey(r => r.Id);
                e.HasOne(r => r.User)
                    .WithMany(u => u.Results)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.Quiz)
                    .WithMany(q => q.Results)
                    .HasForeignKey(r => r.QuizId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // LessonProgress
            modelBuilder.Entity<LessonProgress>(e =>
            {
                e.HasKey(lp => lp.Id);
                e.HasIndex(lp => new { lp.UserId, lp.LessonId }).IsUnique();
                e.HasOne(lp => lp.User)
                    .WithMany(u => u.LessonProgresses)
                    .HasForeignKey(lp => lp.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(lp => lp.Lesson)
                    .WithMany(l => l.LessonProgresses)
                    .HasForeignKey(lp => lp.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Comment
            modelBuilder.Entity<Comment>(e =>
            {
                e.HasKey(c => c.Id);
                e.HasOne(c => c.User)
                    .WithMany(u => u.Comments)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(c => c.Lesson)
                    .WithMany(l => l.Comments)
                    .HasForeignKey(c => c.LessonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Certificate
            modelBuilder.Entity<Certificate>(e =>
            {
                e.HasKey(c => c.Id);
                e.HasIndex(c => new { c.UserId, c.CourseId }).IsUnique(); // one cert per course per user
                e.HasOne(c => c.User)
                    .WithMany(u => u.Certificates)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(c => c.Course)
                    .WithMany()
                    .HasForeignKey(c => c.CourseId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Notification
            modelBuilder.Entity<Notification>(e =>
            {
                e.HasKey(n => n.Id);
                e.HasOne(n => n.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
