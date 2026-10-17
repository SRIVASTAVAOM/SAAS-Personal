import bcrypt from 'bcrypt';
import { pool } from '../config/db.config';

export async function runSeeds(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[Seed]: Starting database seeding...');
    await client.query('BEGIN');

    // 1. Roles
    const roles = ['STUDENT', 'TEACHER', 'ACCOUNTANT', 'COORDINATOR', 'MANAGEMENT'];
    const roleMap: Record<string, string> = {};
    for (const roleName of roles) {
      const res = await client.query(
        `INSERT INTO roles (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name;`,
        [roleName]
      );
      roleMap[res.rows[0].name] = res.rows[0].id;
    }

    // 2. School
    const schoolRes = await client.query(
      `INSERT INTO schools (name, code, contact_email, contact_phone, address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      ['Apex International School', 'APEX01', 'info@apexschool.edu', '+91 9876543210', '123 Education Lane, Knowledge Park']
    );
    const schoolId = schoolRes.rows[0].id;

    // 3. Academic Year
    const yearRes = await client.query(
      `INSERT INTO academic_years (school_id, label, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (school_id, label) DO UPDATE SET is_current = EXCLUDED.is_current
       RETURNING id;`,
      [schoolId, '2026-2027', '2026-04-01', '2027-03-31', true]
    );

    // 4. Wings
    const wingRes1 = await client.query(
      `INSERT INTO wings (school_id, name) VALUES ($1, $2)
       ON CONFLICT (school_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [schoolId, 'Primary Wing']
    );
    const wingRes2 = await client.query(
      `INSERT INTO wings (school_id, name) VALUES ($1, $2)
       ON CONFLICT (school_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [schoolId, 'Senior Wing']
    );
    const primaryWingId = wingRes1.rows[0].id;
    const seniorWingId = wingRes2.rows[0].id;

    // 5. Classes
    const classRes = await client.query(
      `INSERT INTO classes (school_id, wing_id, name) VALUES ($1, $2, $3)
       ON CONFLICT (school_id, name) DO UPDATE SET wing_id = EXCLUDED.wing_id
       RETURNING id;`,
      [schoolId, seniorWingId, 'Grade 10']
    );
    const classId = classRes.rows[0].id;

    // 6. Section
    const sectionRes = await client.query(
      `INSERT INTO sections (class_id, name) VALUES ($1, $2)
       ON CONFLICT (class_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [classId, 'Section A']
    );
    const sectionId = sectionRes.rows[0].id;

    // 7. Users Password Hash (Salt 12)
    const rawPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const testUsers = [
      { identifier: 'student1', email: 'student1@apex.edu', phone: '9000000001', role: 'STUDENT', type: 'student' },
      { identifier: 'teacher1', email: 'teacher1@apex.edu', phone: '9000000002', role: 'TEACHER', type: 'staff' },
      { identifier: 'accountant1', email: 'accountant1@apex.edu', phone: '9000000003', role: 'ACCOUNTANT', type: 'staff' },
      { identifier: 'coordinator1', email: 'coordinator1@apex.edu', phone: '9000000004', role: 'COORDINATOR', type: 'staff' },
      { identifier: 'management1', email: 'management1@apex.edu', phone: '9000000005', role: 'MANAGEMENT', type: 'staff' },
    ];

    for (const u of testUsers) {
      const userRes = await client.query(
        `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (identifier) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id;`,
        [schoolId, u.identifier, u.email, u.phone, passwordHash, true]
      );
      const userId = userRes.rows[0].id;

      // Assign role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING;`,
        [userId, roleMap[u.role]]
      );

      // Create profile
      if (u.type === 'student') {
        await client.query(
          `INSERT INTO student_profiles (
            user_id, admission_number, roll_number, first_name, last_name,
            gender, date_of_birth, admission_date, current_class_id, current_section_id,
            father_name, mother_name, emergency_phone, blood_group, medical_notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (user_id) DO NOTHING;`,
          [
            userId, 'ADM2026001', '101', 'Aarav', 'Sharma',
            'Male', '2010-05-15', '2026-04-01', classId, sectionId,
            'Rajesh Sharma', 'Sunita Sharma', u.phone, 'O+', 'No allergies'
          ]
        );
      } else {
        const staffRes = await client.query(
          `INSERT INTO staff_profiles (
            user_id, employee_code, first_name, last_name, gender,
            date_of_birth, qualification, joining_date, emergency_phone, phone, blood_group
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, qualification = EXCLUDED.qualification
           RETURNING id;`,
          [
            userId, `EMP-${u.identifier.toUpperCase()}`, u.role, 'Staff',
            'Other', '1988-08-20', 'M.Sc., B.Ed.', '2024-06-01', u.phone, u.phone, 'B+'
          ]
        );
        const staffId = staffRes.rows[0].id;

        // Add scoped assignment for Coordinator & Teacher
        if (u.role === 'COORDINATOR') {
          const assignCheck = await client.query(
            `SELECT id FROM staff_assignments WHERE staff_id = $1 AND assignment_type = 'COORDINATOR';`,
            [staffId]
          );
          if (assignCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO staff_assignments (staff_id, wing_id, assignment_type)
               VALUES ($1, $2, $3);`,
              [staffId, seniorWingId, 'COORDINATOR']
            );
          }
        } else if (u.role === 'TEACHER') {
          const assignCheck = await client.query(
            `SELECT id FROM staff_assignments WHERE staff_id = $1 AND assignment_type = 'CLASS_TEACHER';`,
            [staffId]
          );
          if (assignCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO staff_assignments (staff_id, wing_id, class_id, section_id, assignment_type)
               VALUES ($1, $2, $3, $4, $5);`,
              [staffId, seniorWingId, classId, sectionId, 'CLASS_TEACHER']
            );
          }
        }
      }
    }

    // Ensure all existing teacher staff assignments have their wing_id set
    await client.query(`
      UPDATE staff_assignments sa
      SET wing_id = c.wing_id
      FROM classes c
      WHERE sa.class_id = c.id AND sa.wing_id IS NULL;
    `);

    // 8. Seed Second Student (Riya Patel) for realistic roster testing
    const s2Res = await client.query(
      `INSERT INTO users (school_id, identifier, email, phone, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (identifier) DO NOTHING
       RETURNING id;`,
      [schoolId, 'student2', 'student2@apex.edu', '9000000006', passwordHash, true]
    );
    if (s2Res.rows.length > 0) {
      const s2UserId = s2Res.rows[0].id;
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [s2UserId, roleMap['STUDENT']]
      );
      await client.query(
        `INSERT INTO student_profiles (
          user_id, admission_number, roll_number, first_name, last_name,
          gender, date_of_birth, admission_date, current_class_id, current_section_id,
          father_name, mother_name, emergency_phone, blood_group, medical_notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (user_id) DO NOTHING;`,
        [
          s2UserId, 'ADM2026002', '102', 'Riya', 'Patel',
          'Female', '2010-08-22', '2026-04-01', classId, sectionId,
          'Suresh Patel', 'Kavita Patel', '9000000006', 'A+', 'None'
        ]
      );
    }

    // 9. Seed Subjects
    const subjects = [
      { name: 'Mathematics', code: 'MATH10' },
      { name: 'Science', code: 'SCI10' },
      { name: 'English', code: 'ENG10' },
      { name: 'Social Studies', code: 'SST10' },
    ];
    const subjectMap: Record<string, string> = {};
    for (const sub of subjects) {
      const subRes = await client.query(
        `INSERT INTO subjects (school_id, name, code)
         VALUES ($1, $2, $3)
         ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code;`,
        [schoolId, sub.name, sub.code]
      );
      subjectMap[subRes.rows[0].code] = subRes.rows[0].id;

      // Link to Grade 10
      await client.query(
        `INSERT INTO class_subjects (class_id, subject_id, is_elective)
         VALUES ($1, $2, false)
         ON CONFLICT (class_id, subject_id) DO NOTHING;`,
        [classId, subRes.rows[0].id]
      );
    }

    // 10. Allocate Teacher1 to Mathematics & Science for Grade 10 Section A
    const teacherStaff = await client.query(
      `SELECT sp.id FROM staff_profiles sp JOIN users u ON sp.user_id = u.id WHERE u.identifier = 'teacher1';`
    );
    if (teacherStaff.rows.length > 0) {
      const teacherStaffId = teacherStaff.rows[0].id;
      const mathId = subjectMap['MATH10'];
      const sciId = subjectMap['SCI10'];

      if (mathId) {
        await client.query(
          `INSERT INTO teacher_subject_allocations (staff_id, class_id, section_id, subject_id, academic_year_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING;`,
          [teacherStaffId, classId, sectionId, mathId, yearRes.rows[0].id]
        );
      }
      if (sciId) {
        await client.query(
          `INSERT INTO teacher_subject_allocations (staff_id, class_id, section_id, subject_id, academic_year_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING;`,
          [teacherStaffId, classId, sectionId, sciId, yearRes.rows[0].id]
        );
      }
    }

    // 11. Seed Student Attendance (Past dates for Student 1 & 2)
    const std1Res = await client.query(
      `SELECT stp.id FROM student_profiles stp JOIN users u ON stp.user_id = u.id WHERE u.identifier = 'student1';`
    );
    const std2Res = await client.query(
      `SELECT stp.id FROM student_profiles stp JOIN users u ON stp.user_id = u.id WHERE u.identifier = 'student2';`
    );

    if (std1Res.rows.length > 0 && teacherStaff.rows.length > 0) {
      const s1Id = std1Res.rows[0].id;
      const tId = teacherStaff.rows[0].id;
      await client.query(
        `INSERT INTO student_attendance_records (school_id, student_id, class_id, section_id, attendance_date, status, marked_by_staff_id, remarks)
         VALUES 
           ($1, $2, $3, $4, '2026-10-09', 'PRESENT', $5, 'Regular class attendance'),
           ($1, $2, $3, $4, '2026-10-10', 'PRESENT', $5, 'Regular class attendance')
         ON CONFLICT (student_id, attendance_date) DO NOTHING;`,
        [schoolId, s1Id, classId, sectionId, tId]
      );
    }

    if (std2Res.rows.length > 0 && teacherStaff.rows.length > 0) {
      const s2Id = std2Res.rows[0].id;
      const tId = teacherStaff.rows[0].id;
      await client.query(
        `INSERT INTO student_attendance_records (school_id, student_id, class_id, section_id, attendance_date, status, marked_by_staff_id, remarks)
         VALUES 
           ($1, $2, $3, $4, '2026-10-09', 'PRESENT', $5, 'Regular class attendance'),
           ($1, $2, $3, $4, '2026-10-10', 'ABSENT', $5, 'Informed absence')
         ON CONFLICT (student_id, attendance_date) DO NOTHING;`,
        [schoolId, s2Id, classId, sectionId, tId]
      );
    }

    // 12. Seed Staff Attendance (Past dates for Teacher 1)
    if (teacherStaff.rows.length > 0) {
      const tId = teacherStaff.rows[0].id;
      await client.query(
        `INSERT INTO staff_attendance_records (school_id, staff_id, attendance_date, status, in_time, out_time, remarks)
         VALUES 
           ($1, $2, '2026-10-09', 'PRESENT', '08:00:00', '15:30:00', 'On-time arrival'),
           ($1, $2, '2026-10-10', 'PRESENT', '07:55:00', '15:30:00', 'On-time arrival')
         ON CONFLICT (staff_id, attendance_date) DO NOTHING;`,
        [schoolId, tId]
      );

      // 13. Seed a pending Staff Leave for Teacher 1
      await client.query(
        `INSERT INTO staff_leaves (school_id, staff_id, leave_type, start_date, end_date, reason, status)
         VALUES ($1, $2, 'CASUAL', '2026-10-20', '2026-10-21', 'Attending family function', 'PENDING')
         ON CONFLICT DO NOTHING;`,
        [schoolId, tId]
      );
    }

    // 14. Seed a pending Student Leave for Student 1
    if (std1Res.rows.length > 0) {
      const s1Id = std1Res.rows[0].id;
      await client.query(
        `INSERT INTO student_leaves (school_id, student_id, class_id, section_id, start_date, end_date, reason, status)
         VALUES ($1, $2, $3, $4, '2026-10-25', '2026-10-26', 'Medical appointment for dental surgery', 'PENDING')
         ON CONFLICT DO NOTHING;`,
        [schoolId, s1Id, classId, sectionId]
      );
    }

    // 15. Seed Curriculum Units & Topics (Grade 10 Mathematics & Science)
    const mathSubjectId = subjectMap['MATH10'];
    const sciSubjectId = subjectMap['SCI10'];
    const academicYearId = yearRes.rows[0].id;

    if (mathSubjectId) {
      const unit1Res = await client.query(
        `INSERT INTO curriculum_units (school_id, academic_year_id, class_id, subject_id, unit_number, title, description)
         VALUES ($1, $2, $3, $4, 1, 'Real Numbers & Polynomials', 'Fundamental theorem of arithmetic and zeroes of polynomials')
         ON CONFLICT (class_id, subject_id, academic_year_id, unit_number) 
         DO UPDATE SET title = EXCLUDED.title
         RETURNING id;`,
        [schoolId, academicYearId, classId, mathSubjectId]
      );
      const unit1Id = unit1Res.rows[0].id;

      await client.query(
        `INSERT INTO curriculum_topics (unit_id, topic_number, title, description, learning_objectives)
         VALUES 
           ($1, 1, 'Euclid Division Lemma & Prime Factorization', 'HCF and LCM using prime factorization', 'Understand unique factorization'),
           ($1, 2, 'Irrational Numbers Proof', 'Proving root 2, root 3, root 5 irrational', 'Master contradiction proofs')
         ON CONFLICT (unit_id, topic_number) DO NOTHING;`,
        [unit1Id]
      );

      const unit2Res = await client.query(
        `INSERT INTO curriculum_units (school_id, academic_year_id, class_id, subject_id, unit_number, title, description)
         VALUES ($1, $2, $3, $4, 2, 'Quadratic Equations & AP', 'Standard form of quadratic equations and arithmetic progression')
         ON CONFLICT (class_id, subject_id, academic_year_id, unit_number)
         DO UPDATE SET title = EXCLUDED.title
         RETURNING id;`,
        [schoolId, academicYearId, classId, mathSubjectId]
      );
      const unit2Id = unit2Res.rows[0].id;

      await client.query(
        `INSERT INTO curriculum_topics (unit_id, topic_number, title, description, learning_objectives)
         VALUES 
           ($1, 1, 'Roots of Quadratic Equations', 'Solving by factorization and quadratic formula', 'Calculate discriminant'),
           ($1, 2, 'Arithmetic Progression nth term', 'General term and sum of n terms', 'Apply AP formulas to real problems')
         ON CONFLICT (unit_id, topic_number) DO NOTHING;`,
        [unit2Id]
      );
    }

    // 16. Seed Homework Assignments (Grade 10 Section A)
    let hw1Id: string | null = null;
    if (teacherStaff.rows.length > 0 && mathSubjectId) {
      const tId = teacherStaff.rows[0].id;
      const existingHw1 = await client.query(
        `SELECT id FROM homework_assignments WHERE school_id = $1 AND class_id = $2 AND title = $3;`,
        [schoolId, classId, 'Exercise 4.2 Quadratic Formula Practice']
      );
      if (existingHw1.rows.length > 0) {
        hw1Id = existingHw1.rows[0].id;
      } else {
        const hwRes = await client.query(
          `INSERT INTO homework_assignments 
            (school_id, class_id, section_id, subject_id, assigned_by_staff_id, 
             title, description, assigned_date, due_date, s3_attachment_key, attachment_name)
           VALUES 
             ($1, $2, $3, $4, $5, 
              'Exercise 4.2 Quadratic Formula Practice', 
              'Solve problems 1 to 10 from NCERT textbook Chapter 4. Show complete step-by-step discriminant working.',
              CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days',
              'schools/APEX01/homework/math_hw_ch4.pdf', 'Quadratic_Formula_Worksheet.pdf')
           RETURNING id;`,
          [schoolId, classId, sectionId, mathSubjectId, tId]
        );
        hw1Id = hwRes.rows[0].id;
      }

      if (sciSubjectId) {
        const existingHw2 = await client.query(
          `SELECT id FROM homework_assignments WHERE school_id = $1 AND class_id = $2 AND title = $3;`,
          [schoolId, classId, 'Chemical Reactions Lab Observations']
        );
        if (existingHw2.rows.length === 0) {
          await client.query(
            `INSERT INTO homework_assignments 
              (school_id, class_id, section_id, subject_id, assigned_by_staff_id, 
               title, description, assigned_date, due_date)
             VALUES 
               ($1, $2, $3, $4, $5, 
                'Chemical Reactions Lab Observations', 
                'Write balanced chemical equations for displacement and double displacement reactions observed in today lab.',
                CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days');`,
            [schoolId, classId, sectionId, sciSubjectId, tId]
          );
        }
      }
    }

    // 17. Seed Student Homework Completion (Student 1 has marked hw1 completed)
    if (std1Res.rows.length > 0 && hw1Id) {
      const s1Id = std1Res.rows[0].id;
      await client.query(
        `INSERT INTO student_homework_completions (homework_id, student_id, status)
         VALUES ($1, $2, 'COMPLETED')
         ON CONFLICT (homework_id, student_id) DO NOTHING;`,
        [hw1Id, s1Id]
      );
    }

    // 18. Seed Verified Academic Material (Grade 10 Mathematics Revision Notes)
    if (teacherStaff.rows.length > 0 && mathSubjectId) {
      const tId = teacherStaff.rows[0].id;
      const existingMat = await client.query(
        `SELECT id FROM academic_materials WHERE school_id = $1 AND class_id = $2 AND title = $3;`,
        [schoolId, classId, 'Chapter 1-4 Comprehensive Formula Sheet']
      );
      if (existingMat.rows.length === 0) {
        await client.query(
          `INSERT INTO academic_materials 
            (school_id, class_id, section_id, subject_id, uploaded_by_staff_id,
             title, description, s3_file_key, file_name, file_size_bytes, content_type, is_verified)
           VALUES 
             ($1, $2, $3, $4, $5,
              'Chapter 1-4 Comprehensive Formula Sheet',
              'Quick reference revision handbook containing all key algebra and quadratic formula derivations.',
              'schools/APEX01/materials/math_grade10_formulas.pdf',
              'Math_Formula_Handbook_Grade10.pdf',
              2457600, 'application/pdf', true);`,
          [schoolId, classId, sectionId, mathSubjectId, tId]
        );
      }
    }

    // 19. Seed Examination (Mid-Term Examination 2026)
    let examId: string;
    const existingExam = await client.query(
      `SELECT id FROM exams WHERE school_id = $1 AND academic_year_id = $2 AND name = $3;`,
      [schoolId, yearRes.rows[0].id, 'Mid-Term Examination 2026']
    );
    if (existingExam.rows.length > 0) {
      examId = existingExam.rows[0].id;
    } else {
      const examRes = await client.query(
        `INSERT INTO exams (school_id, academic_year_id, wing_id, name, description, start_date, end_date, is_published)
         VALUES ($1, $2, $3, 'Mid-Term Examination 2026', 'First term comprehensive assessment for Senior Wing.', '2026-11-01', '2026-11-15', true)
         RETURNING id;`,
        [schoolId, yearRes.rows[0].id, seniorWingId]
      );
      examId = examRes.rows[0].id;
    }

    // 20. Seed Exam Datesheets for Mathematics & Science in Grade 10
    let mathDatesheetId: string | null = null;
    let sciDatesheetId: string | null = null;

    if (mathSubjectId) {
      const dsMath = await client.query(
        `INSERT INTO exam_datesheets (exam_id, class_id, section_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks)
         VALUES ($1, $2, $3, $4, '2026-11-02', '09:00:00', '12:00:00', 100.00, 33.00)
         ON CONFLICT (exam_id, class_id, subject_id) DO UPDATE SET max_marks = EXCLUDED.max_marks
         RETURNING id;`,
        [examId, classId, sectionId, mathSubjectId]
      );
      mathDatesheetId = dsMath.rows[0]?.id;
    }

    if (sciSubjectId) {
      const dsSci = await client.query(
        `INSERT INTO exam_datesheets (exam_id, class_id, section_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks)
         VALUES ($1, $2, $3, $4, '2026-11-05', '09:00:00', '12:00:00', 100.00, 33.00)
         ON CONFLICT (exam_id, class_id, subject_id) DO UPDATE SET max_marks = EXCLUDED.max_marks
         RETURNING id;`,
        [examId, classId, sectionId, sciSubjectId]
      );
      sciDatesheetId = dsSci.rows[0]?.id;
    }

    // 21. Seed Marks for Student 1 and Student 2 (Entered by teacher1)
    if (teacherStaff.rows.length > 0 && std1Res.rows.length > 0) {
      const tId = teacherStaff.rows[0].id;
      const s1Id = std1Res.rows[0].id;
      const s2Id = std2Res.rows.length > 0 ? std2Res.rows[0].id : null;

      if (mathDatesheetId) {
        // S1 Math mark: 88.50
        await client.query(
          `INSERT INTO exam_marks (exam_datesheet_id, student_id, marks_obtained, is_absent, remarks, entered_by_staff_id, status)
           VALUES ($1, $2, 88.50, false, 'Strong mathematical reasoning', $3, 'VERIFIED')
           ON CONFLICT (exam_datesheet_id, student_id) DO NOTHING;`,
          [mathDatesheetId, s1Id, tId]
        );
        // S2 Math mark: 74.00
        if (s2Id) {
          await client.query(
            `INSERT INTO exam_marks (exam_datesheet_id, student_id, marks_obtained, is_absent, remarks, entered_by_staff_id, status)
             VALUES ($1, $2, 74.00, false, 'Good effort', $3, 'VERIFIED')
             ON CONFLICT (exam_datesheet_id, student_id) DO NOTHING;`,
            [mathDatesheetId, s2Id, tId]
          );
        }
      }

      if (sciDatesheetId) {
        // S1 Science mark: 92.00
        await client.query(
          `INSERT INTO exam_marks (exam_datesheet_id, student_id, marks_obtained, is_absent, remarks, entered_by_staff_id, status)
           VALUES ($1, $2, 92.00, false, 'Excellent lab and theoretical performance', $3, 'VERIFIED')
           ON CONFLICT (exam_datesheet_id, student_id) DO NOTHING;`,
          [sciDatesheetId, s1Id, tId]
        );
        // S2 Science mark: Absent
        if (s2Id) {
          await client.query(
            `INSERT INTO exam_marks (exam_datesheet_id, student_id, marks_obtained, is_absent, remarks, entered_by_staff_id, status)
             VALUES ($1, $2, NULL, true, 'Medical leave on exam day', $3, 'VERIFIED')
             ON CONFLICT (exam_datesheet_id, student_id) DO NOTHING;`,
            [sciDatesheetId, s2Id, tId]
          );
        }
      }

      // 22. Seed Generated & Approved Report Card for Student 1
      await client.query(
        `INSERT INTO report_cards (
           exam_id, student_id, class_id, section_id,
           total_marks_obtained, total_max_marks, percentage,
           subjects_evaluated_count, subjects_absent_count,
           status, class_teacher_remarks, generated_by_staff_id, approved_at
         ) VALUES (
           $1, $2, $3, $4,
           180.50, 200.00, 90.25,
           2, 0,
           'APPROVED', 'Outstanding academic performance across all subjects.', $5, CURRENT_TIMESTAMP
         ) ON CONFLICT (exam_id, student_id) DO NOTHING;`,
        [examId, s1Id, classId, sectionId, tId]
      );
    }

    await client.query('COMMIT');
    console.log('[Seed]: Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]: Seeding failed, rolled back.', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
