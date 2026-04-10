import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={28} style={{ color: 'var(--color-accent)' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.title')}
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('privacy.lastUpdated')}: 2026-04-11
        </p>
      </div>

      <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.introTitle')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.introText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.collectionTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.collectionText1')}
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li>{t('privacy.collectionItem1')}</li>
            <li>{t('privacy.collectionItem2')}</li>
            <li>{t('privacy.collectionItem3')}</li>
            <li>{t('privacy.collectionItem4')}</li>
          </ul>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.collectionText2')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.storageTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.storageText1')}
          </p>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.storageText2')}
          </p>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.storageText3')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.userRightsTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.userRightsText')}
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li>{t('privacy.userRight1')}</li>
            <li>{t('privacy.userRight2')}</li>
            <li>{t('privacy.userRight3')}</li>
            <li>{t('privacy.userRight4')}</li>
            <li>{t('privacy.userRight5')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.thirdPartyTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.thirdPartyText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.childrenTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.childrenText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.changesTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.changesText')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('privacy.contactTitle')}
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('privacy.contactText')}
          </p>
        </section>
      </div>
    </div>
  )
}
