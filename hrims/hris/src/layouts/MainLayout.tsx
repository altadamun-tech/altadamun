import { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Button, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t, i18n } = useTranslation();

  const handleLangChange = (e: any) => {
    i18n.changeLanguage(e.target.value);
    document.body.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          <Select
            value={i18n.language}
            onChange={handleLangChange}
            size="small"
            sx={{ color: '#fff', borderColor: '#fff', mr: 2 }}
          >
            <MenuItem value="ar">{t('app.arabic')}</MenuItem>
            <MenuItem value="en">{t('app.english')}</MenuItem>
          </Select>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
