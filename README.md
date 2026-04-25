# sonaby

## Connexion simplifiée (démo)

Pour faciliter l'accès pendant la démo (admin + employé), la page `/auth/login`
affiche des boutons **Entrer côté Employé/Admin** si ces variables sont définies
côté front:

```bash
NEXT_PUBLIC_DEMO_EMPLOYEE_EMAIL=
NEXT_PUBLIC_DEMO_EMPLOYEE_PASSWORD=
NEXT_PUBLIC_DEMO_ADMIN_EMAIL=
NEXT_PUBLIC_DEMO_ADMIN_PASSWORD=
```

Les boutons utilisent `signInWithPassword` Supabase puis redirigent vers
`/employee` ou `/admin`.
