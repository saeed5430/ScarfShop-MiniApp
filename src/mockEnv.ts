import { installBaleMock } from '@/bale/mock';
import { isBaleEnvironment } from '@/bale/webApp';

if (import.meta.env.DEV && !isBaleEnvironment()) {
  installBaleMock();

  console.info(
    '⚠️ As long as the current environment was not considered as the Bale-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Bale.',
  );
}
