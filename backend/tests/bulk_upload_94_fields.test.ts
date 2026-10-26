import request from 'supertest';
import app from '../src/app';

describe('Bulk Upload 94 Legacy ERP Fields Integration Test', () => {
  let adminToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'management1', password: 'Password@123' });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;
  });

  it('POST /api/v1/admin/students/bulk-upload accepts student with 94 fields and preserves extra_data', async () => {
    const testAdmNo = `LEGACY-STU-${Date.now()}`;
    const studentWith94Fields = {
      id: '99',
      enq_no: 'ENQ-9901',
      adm_no: testAdmNo,
      adm_no_old: 'OLD-9901',
      adm_no_sch: 'SCH-9901',
      reg_no: 'REG-9901',
      type: 'Day Scholar',
      stu_name: 'Devansh Singhal',
      stu_name_hindi: 'देवांश सिंघल',
      username: testAdmNo,
      password: 'Student@123',
      fat_name: 'Praveen Singhal',
      fat_occu: 'Chartered Accountant',
      fat_income: '1200000',
      mot_name: 'Sangeeta Singhal',
      mot_occ: 'Professor',
      guard_occ: 'Business',
      mot_income: '800000',
      guard_income: '0',
      height: '155',
      weight: '50',
      lang: 'Hindi',
      cast_cert_no: 'CC-9988-12',
      father_pan: 'PANSINGH123',
      fat_qual: 'CA, M.Com',
      mot_qual: 'Ph.D.',
      guard_qual: 'Graduate',
      guard_name: 'Praveen Singhal',
      guard_relation: 'Father',
      guard_no: '9811122233',
      guard_no2: '9811122244',
      house: 'Emerald',
      stream: 'Science',
      adm_class: 'Grade 10',
      adm_category: 'General',
      class: 'Grade 10',
      sec: 'Section A',
      gender: 'MALE',
      religion: 'Hindu',
      nationality: 'Indian',
      category: 'General',
      address: 'Plot 42 Sector 15 Rohini Delhi',
      address_co: 'Plot 42 Sector 15 Rohini Delhi',
      mobile: '9811122233',
      mobile2: '9811122244',
      mobile_co: '9811122233',
      mobile2_co: '9811122244',
      roll_no: '42',
      sssn: 'SSSN-4242',
      dob: '2011-03-25',
      do_adm: '2024-04-01',
      new_old: 'New',
      school1_name: 'Delhi Public School',
      school1_class: 'Grade 9',
      school1_session: '2023-2024',
      school1_curri: 'CBSE',
      school1_sub: 'All Subjects',
      school2_name: '',
      school2_class: '',
      school2_session: '',
      school2_curri: '',
      school2_sub: '',
      school3_name: '',
      school3_class: '',
      school3_session: '',
      school3_curri: '',
      school3_sub: '',
      photo_stu: '',
      photo_fat: '',
      photo_mot: '',
      photo_guard: '',
      allow_discount: 'No',
      is_shown: 'Yes',
      tc_issue: 'No',
      fee_cat: 'General',
      session: '2026-2027',
      student_aadhar: '123456789012',
      aadhar_mother: '234567890123',
      pan_mother: 'PANMOTH456',
      caste: 'General',
      fee_type: 'Quarterly',
      stu_email: 'devansh@school.edu',
      weight2: '50',
      height2: '155',
      fat_email: 'praveen@gmail.com',
      mot_email: 'sangeeta@gmail.com',
      guard_email: 'praveen@gmail.com',
      father_nationality: 'Indian',
      mother_nationality: 'Indian',
      aadhar_father: '345678901234',
      fat_mobile: '9811122233',
      fat_mobile2: '9811122244',
      mot_mobile: '9811122255',
      mot_mobile2: '9811122266',
    };

    const res = await request(app)
      .post('/api/v1/admin/students/bulk-upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ students: [studentWith94Fields] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(1);

    // Verify student was created with all fields populated
    const listRes = await request(app)
      .get(`/api/v1/admin/students?search=${testAdmNo}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    const createdStudent = listRes.body.data.find((s: any) => s.admission_number === testAdmNo);
    expect(createdStudent).toBeDefined();
    expect(createdStudent.first_name).toBe('Devansh');
    expect(createdStudent.last_name).toBe('Singhal');
    expect(createdStudent.roll_number).toBe('42');

    // Verify 360-degree details including extra_data
    const detailRes = await request(app)
      .get(`/api/v1/admin/students/${createdStudent.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailRes.status).toBe(200);
    const details = detailRes.body.data;
    expect(details.admission_number).toBe(testAdmNo);
    expect(details.student_aadhar).toBe('123456789012');
    expect(details.caste).toBe('General');
    expect(details.address).toContain('Rohini Delhi');
    expect(details.extra_data).toBeDefined();
    expect(details.extra_data.cast_cert_no).toBe('CC-9988-12');
    expect(details.extra_data.fat_occu).toBe('Chartered Accountant');
    expect(details.extra_data.mot_qual).toBe('Ph.D.');
    expect(details.extra_data.house).toBe('Emerald');
  });
});
