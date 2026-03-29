import { BaseNavbar } from './BaseNavbar';
import { withAuthLinks } from './decorators/withAuthLinks';
import { withProfile } from './decorators/withProfile';
import { withStatistics } from './decorators/withStatistics';
import { withVirusTotal } from './decorators/withVirusTotal';

// Type 1: Home page navbar (Log in / Sign up)
export const HomeNavbar = withAuthLinks(BaseNavbar);

// Type 2: Authenticated navbar (Statistics + Profile Menu)
export const AuthenticatedNavbar = withProfile(withStatistics(BaseNavbar));

// Type 3: Simple navbar (Just title)
export const SimpleNavbar = BaseNavbar;

// Type 4: Scan report navbar (brand + VirusTotal attribution)
export const ScanReportNavbar = withVirusTotal(BaseNavbar);
