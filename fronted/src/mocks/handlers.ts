import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const { email } = await request.json();
    return HttpResponse.json({
      token: `mock.${btoa(email)}`,
      user: { id: 'u_1', email },
    });
  }),
  http.get('/profiles/me', () =>
    HttpResponse.json({ id: 'u_1', email: 'demo@demo.com', name: '데모' }),
  ),
];

