import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Index from '@/pages/Index';
import Embed from '@/pages/Embed';
import SponsorPage from '@/pages/Sponsor';
import { Privacy, Terms, Refund, Contact } from '@/pages/Legal';
import SceneBackground from '@/components/SceneBackground';
import SettingsModal from '@/components/SettingsModal';
import { SCENES } from '@/lib/scenes';
import { useStore } from '@/store/useStore';

class IO { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).IntersectionObserver ??= IO;
(globalThis as any).ResizeObserver ??= IO;

const at = (el: JSX.Element, path = '/') => render(<MemoryRouter initialEntries={[path]}>{el}</MemoryRouter>);

describe('pages render without crashing', () => {
  it('landing', () => {
    const { container } = at(<Landing />);
    expect(container.textContent).toContain('Focus that feels');
    expect(container.textContent).toContain('Pick your aesthetic');
    expect(container.textContent).toContain('Works in Notion');
  });
  it('app', () => { const { container } = at(<Index />, '/app'); expect(container.textContent).toContain('Statistics'); });
  it('embed', () => { const { container } = at(<Embed />, '/embed?scene=sakura&theme=dark'); expect(container.textContent).toContain('Made with Cozy Flow'); });
  it('sponsor', () => { const { container } = at(<SponsorPage />, '/sponsor'); expect(container.textContent).toContain('Sponsor Cozy Flow'); });
  it.each([
    ['privacy', Privacy, 'Privacy Policy'], ['terms', Terms, 'Terms of Service'],
    ['refund', Refund, 'Refund and Cancellation Policy'], ['contact', Contact, 'Contact'],
  ] as const)('legal page %s', (_n, Page, heading) => {
    const { container } = at(<Page />);
    expect(container.textContent).toContain(heading);
    expect(container.textContent).toContain('Last updated');
  });
  it('settings modal with scene and chime pickers', () => {
    const { baseElement } = at(<SettingsModal open onOpenChange={() => {}} />);
    expect(baseElement.textContent).toContain('Scene');
    expect(baseElement.textContent).toContain('Alarm sound');
    expect(baseElement.textContent).toContain('Font style');
  });
  it.each(SCENES.map(s => s.id))('scene %s renders in light and dark', (id) => {
    for (const theme of ['light', 'dark'] as const) {
      useStore.setState({ theme, settings: { ...useStore.getState().settings, scene: id } });
      const { container, unmount } = at(<SceneBackground />);
      expect(container).toBeTruthy();
      unmount();
    }
  });
});
