import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  LayoutDashboard, 
  Euro, 
  History, 
  Sun, 
  Moon,
  Bell,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import { AppLoadingSpinner } from './components/AppLoadingSpinner';
import { AuthView } from './components/AuthView';
import { NavigationSidebar } from './components/NavigationSidebar';
import { ModalsContainer } from './components/ModalsContainer';

// Custom Hook
import { usePropertyApp } from './hooks/usePropertyApp';

// Tab Contents
import { DashboardTab } from './components/DashboardTab';
import { PropertiesTab } from './components/PropertiesTab';
import { LeasesTab } from './components/LeasesTab';
import { TenantsTab } from './components/TenantsTab';
import { PaymentsTab } from './components/PaymentsTab';
import { HistoryTab } from './components/HistoryTab';

export default function App() {
  const store = usePropertyApp();

  // Loading Screens check
  if (store.appLoading) {
    return <AppLoadingSpinner />;
  }

  // Auth wall check
  if (!store.token) {
    return (
      <AuthView
        authMode={store.authMode}
        setAuthMode={store.setAuthMode}
        email={store.email}
        setEmail={store.setEmail}
        password={store.password}
        setPassword={store.setPassword}
        firstName={store.firstName}
        setFirstName={store.setFirstName}
        lastName={store.lastName}
        setLastName={store.setLastName}
        authError={store.authError}
        setAuthError={store.setAuthError}
        loading={store.loading}
        handleLogin={store.handleLogin}
        handleRegister={store.handleRegister}
        handleGoogleSignIn={store.handleGoogleSignIn}
        useLocalAuth={store.useLocalAuth}
        setUseLocalAuth={store.setUseLocalAuth}
      />
    );
  }

  const selectedHistoryLeaseHistory = store.selectedHistoryLease 
    ? store.getLeasePaymentHistory(store.selectedHistoryLease) 
    : [];

  const selectedStatementLeaseHistory = store.selectedStatementLease 
    ? store.getLeasePaymentHistory(store.selectedStatementLease) 
    : [];

  return (
    <div id="immo-app-root" className="min-h-screen bg-neutral-950 text-neutral-300 flex selection:bg-indigo-500/30">
      {/* Sidebar navigation */}
      <NavigationSidebar
        activeTab={store.activeTab}
        setActiveTab={store.setActiveTab}
        currency={store.currency}
        setCurrency={store.setCurrency}
        theme={store.theme}
        setTheme={store.setTheme}
        user={store.user}
        handleLogout={store.handleLogout}
        setToastMsg={store.setToastMsg}
        expiringBailsCount={store.expiringLeases.length}
        lateContractsCount={store.lateContractsCount}
      />

      {/* Main Content Area */}
      <main id="main-scroll-view" className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-28 md:pb-12 relative h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Top bar with Logo & Currency selector */}
          <div id="mobile-titlebar" className="flex md:hidden items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" className="w-7 h-7 select-none" alt="ImmoManage Logo" referrerPolicy="no-referrer" />
              <span className="font-bold text-white text-base tracking-tight">ImmoManage</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                id="mobile-theme-toggler"
                onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} 
                className="text-neutral-500 hover:text-indigo-400 p-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 cursor-pointer flex items-center justify-center shrink-0 transition-all"
                title={store.theme === 'dark' ? 'Activate Light Mode' : 'Activate Dark Mode'}
              >
                {store.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>

              {/* Compact Currency Switcher */}
              <div id="mobile-currency-bar" className="flex bg-neutral-900 px-1 py-1 rounded-xl border border-neutral-800 text-[11px]">
                {(['EUR', 'USD', 'FCFA'] as const).map((curr) => (
                  <button
                    id={`mobile-curr-${curr}`}
                    key={curr}
                    onClick={() => {
                      store.setCurrency(curr);
                      localStorage.setItem('property_currency', curr);
                      store.setToastMsg(`Currency changed: ${curr === 'EUR' ? 'Euro (€)' : curr === 'USD' ? 'Dollar ($)' : 'Franc CFA (FCFA)'}`);
                    }}
                    className={`px-2 py-1 rounded-lg font-bold font-mono transition-all duration-200 cursor-pointer ${
                      store.currency === curr
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {curr === 'EUR' ? '€' : curr === 'USD' ? '$' : 'CFA'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Render Active Tab */}
          {store.activeTab === 'dashboard' && (
            <DashboardTab
              user={store.user}
              expiringBails={store.expiringLeases}
              notifiedContrats={store.notifiedLeases}
              handleSendExpiryNotification={store.sendExpiryNotification}
              activeBiensCount={store.activePropertiesCount}
              locatairesCount={store.tenants.length}
              activeContractsCount={store.activeContractsCount}
              monthlyRentRevenue={store.monthlyRentRevenue}
              vacancyRate={store.vacancyRate}
              theme={store.theme}
              last6MonthsData={store.last6MonthsData}
              biens={store.properties}
              formatPrice={store.formatPrice}
              setActiveTab={store.setActiveTab}
              openNewBien={store.openNewProperty}
              openNewLocataire={store.openNewTenant}
              openNewContrat={store.openNewLease}
            />
          )}

          {store.activeTab === 'biens' && (
            <PropertiesTab
              openNewBien={store.openNewProperty}
              searchTerm={store.searchTerm}
              setSearchTerm={store.setSearchTerm}
              filterType={store.filterType}
              setFilterType={store.setFilterType}
              loadingBiens={store.loadingProperties}
              filteredBiens={store.filteredProperties}
              formatPrice={store.formatPrice}
              openEditBien={store.openEditProperty}
              handleDeleteBien={store.handleDeleteProperty}
            />
          )}

          {store.activeTab === 'contrats' && (
            <LeasesTab
              openNewContrat={store.openNewLease}
              expiringBails={store.expiringLeases}
              notifiedContrats={store.notifiedLeases}
              handleSendExpiryNotification={store.sendExpiryNotification}
              loadingContrats={store.loadingLeases}
              contrats={store.leases}
              formatPrice={store.formatPrice}
              handlePrintContrat={store.handlePrintLease}
              openDocModal={store.openDocModal}
              openEditContrat={store.openEditLease}
              handleDeleteContrat={store.handleDeleteLease}
            />
          )}

          {store.activeTab === 'clients' && (
            <TenantsTab
              openNewLocataire={store.openNewTenant}
              locataires={store.tenants}
              setSelectedClientForDetails={store.setSelectedTenantForDetails}
              setIsClientDetailsOpen={store.setIsTenantDetailsOpen}
              formatPrice={store.formatPrice}
              openEditLocataire={store.openEditTenant}
              handleDeleteLocataire={store.handleDeleteTenant}
            />
          )}

          {store.activeTab === 'paiements' && (
            <PaymentsTab
              paymentsSubTab={store.paymentsSubTab}
              setPaymentsSubTab={store.setPaymentsSubTab}
              lateContractsCount={store.lateContractsCount}
              totalPaidRent={store.totalPaidRent}
              complianceRate={store.complianceRate}
              totalLateRent={store.totalLateRent}
              contrats={store.leases}
              setSelectedHistoryContrat={store.setSelectedHistoryLease}
              getContratPaymentStatus={store.getLeasePaymentStatus}
              formatPrice={store.formatPrice}
              getContratPaymentHistory={store.getLeasePaymentHistory}
              setSelectedReleveContrat={store.setSelectedStatementLease}
            />
          )}

          {store.activeTab === 'historique' && (
            <HistoryTab
              setConfirmModal={store.setConfirmModal}
              setActionLogs={store.setActionLogs}
              setToastMsg={store.setToastMsg}
              historyFilter={store.historyFilter}
              setHistoryFilter={store.setHistoryFilter}
              historyStartDate={store.historyStartDate}
              setHistoryStartDate={store.setHistoryStartDate}
              historyEndDate={store.historyEndDate}
              setHistoryEndDate={store.setHistoryEndDate}
              filteredLogs={store.filteredLogs}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div id="mobile-navbar" className="fixed bottom-0 left-0 right-0 z-[80] block md:hidden bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800/80 shadow-2xl pb-2">
        <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-lg mx-auto">
          {/* Dashboard */}
          <button 
            onClick={() => store.setActiveTab('dashboard')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'dashboard' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'dashboard' ? 'text-white' : 'text-neutral-500'
            }`}>
              Dashboard
            </span>
            {store.activeTab === 'dashboard' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>

          {/* Properties */}
          <button 
            onClick={() => store.setActiveTab('biens')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'biens' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'biens' ? 'text-white' : 'text-neutral-500'
            }`}>
              Properties
            </span>
            {store.activeTab === 'biens' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>

          {/* Tenants */}
          <button 
            onClick={() => store.setActiveTab('clients')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'clients' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'clients' ? 'text-white' : 'text-neutral-500'
            }`}>
              Tenants
            </span>
            {store.activeTab === 'clients' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>

          {/* Leases */}
          <button 
            onClick={() => store.setActiveTab('contrats')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'contrats' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'contrats' ? 'text-white' : 'text-neutral-500'
            }`}>
              Leases
            </span>
            {store.activeTab === 'contrats' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>

          {/* Payments */}
          <button 
            onClick={() => store.setActiveTab('paiements')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'paiements' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <Euro className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'paiements' ? 'text-white' : 'text-neutral-500'
            }`}>
              Payments
            </span>
            {store.activeTab === 'paiements' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>

          {/* History */}
          <button 
            onClick={() => store.setActiveTab('historique')}
            className="flex-1 flex flex-col items-center justify-center transition-all cursor-pointer relative"
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              store.activeTab === 'historique' 
                ? 'bg-indigo-500/10 text-indigo-400 scale-105 border border-indigo-500/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}>
              <History className="w-5 h-5" />
            </div>
            <span className={`text-[8px] font-bold tracking-wider mt-1 uppercase transition-colors duration-200 ${
              store.activeTab === 'historique' ? 'text-white' : 'text-neutral-500'
            }`}>
              History
            </span>
            {store.activeTab === 'historique' && (
              <motion.span 
                layoutId="activeSubdotMobile"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 absolute bottom-[-4px]" 
              />
            )}
          </button>
        </div>
      </div>

      {/* Floating System Toast Container */}
      <AnimatePresence>
        {store.toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-neutral-900 border border-indigo-500/30 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-indigo-400 font-sans">Lease Alert</h5>
              <p className="text-[11px] text-neutral-200 mt-0.5 leading-snug break-words font-sans">{store.toastMsg}</p>
            </div>
            <button onClick={() => store.setToastMsg(null)} className="text-neutral-500 hover:text-neutral-300 ml-1 shrink-0 p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render all overlay modals cleanly */}
      <ModalsContainer
        confirmModal={store.confirmModal}
        setConfirmModal={store.setConfirmModal}
        isPropertyModalOpen={store.isPropertyModalOpen}
        setIsPropertyModalOpen={store.setIsPropertyModalOpen}
        handleSaveProperty={store.handleSaveProperty}
        editingProperty={store.editingProperty}
        propertyTitle={store.propertyTitle}
        setPropertyTitle={store.setPropertyTitle}
        propertyType={store.propertyType}
        setPropertyType={store.setPropertyType}
        propertyPrice={store.propertyPrice}
        setPropertyPrice={store.setPropertyPrice}
        propertyCity={store.propertyCity}
        setPropertyCity={store.setPropertyCity}
        propertyStatus={store.propertyStatus}
        setPropertyStatus={store.setPropertyStatus}
        propertySurface={store.propertySurface}
        setPropertySurface={store.setPropertySurface}
        propertyRooms={store.propertyRooms}
        setPropertyRooms={store.setPropertyRooms}
        propertyDescription={store.propertyDescription}
        setPropertyDescription={store.setPropertyDescription}
        propertyErrors={store.propertyErrors}
        touched={store.touched}
        attemptedSubmitOnProperty={store.attemptedSubmit.bien ?? false}
        markTouched={store.markTouched}
        isDocModalOpen={store.isDocModalOpen}
        setIsDocModalOpen={store.setIsDocModalOpen}
        selectedContratForDoc={store.selectedContratForDoc}
        docTitre={store.docTitre}
        setDocTitre={store.setDocTitre}
        docType={store.docType}
        setDocType={store.setDocType}
        isUploading={store.isUploading}
        uploadProgress={store.uploadProgress}
        docError={store.docError}
        contractDocuments={store.contractDocuments}
        handleUploadDocument={store.handleUploadDocument}
        handleDeleteDocument={store.handleDeleteDocument}
        isTenantModalOpen={store.isTenantModalOpen}
        setIsTenantModalOpen={store.setIsTenantModalOpen}
        handleSaveTenant={store.handleSaveTenant}
        editingTenant={store.editingTenant}
        tenantFirstName={store.tenantFirstName}
        setTenantFirstName={store.setTenantFirstName}
        tenantLastName={store.tenantLastName}
        setTenantLastName={store.setTenantLastName}
        tenantEmail={store.tenantEmail}
        setTenantEmail={store.setTenantEmail}
        tenantPhone={store.tenantPhone}
        setTenantPhone={store.setTenantPhone}
        tenantProfession={store.tenantProfession}
        setTenantProfession={store.setTenantProfession}
        tenantIncome={store.tenantIncome}
        setTenantIncome={store.setTenantIncome}
        tenantIdCard={store.tenantIdCard}
        setTenantIdCard={store.setTenantIdCard}
        tenantErrors={store.tenantErrors}
        attemptedSubmitOnTenant={store.attemptedSubmit.locataire ?? false}
        isTenantDetailsOpen={store.isTenantDetailsOpen}
        setIsTenantDetailsOpen={store.setIsTenantDetailsOpen}
        selectedTenantForDetails={store.selectedTenantForDetails}
        leases={store.leases}
        currency={store.currency}
        isLeaseModalOpen={store.isLeaseModalOpen}
        setIsLeaseModalOpen={store.setIsLeaseModalOpen}
        handleSaveLease={store.handleSaveLease}
        editingLease={store.editingLease}
        leaseType={store.leaseType}
        setLeaseType={store.setLeaseType}
        leaseStatus={store.leaseStatus}
        setLeaseStatus={store.setLeaseStatus}
        leasePropertyId={store.leasePropertyId}
        setLeasePropertyId={store.setLeasePropertyId}
        leaseTenantId={store.leaseTenantId}
        setLeaseTenantId={store.setLeaseTenantId}
        leaseStartDate={store.leaseStartDate}
        setLeaseStartDate={store.setLeaseStartDate}
        leaseEndDate={store.leaseEndDate}
        setLeaseEndDate={store.setLeaseEndDate}
        leaseMonthlyRent={store.leaseMonthlyRent}
        setLeaseMonthlyRent={store.setLeaseMonthlyRent}
        leaseSalePrice={store.leaseSalePrice}
        setLeaseSalePrice={store.setLeaseSalePrice}
        properties={store.properties}
        tenants={store.tenants}
        leaseErrors={store.leaseErrors}
        attemptedSubmitOnLease={store.attemptedSubmit.contrat ?? false}
        selectedHistoryLease={store.selectedHistoryLease}
        setSelectedHistoryLease={store.setSelectedHistoryLease}
        paymentHistory={selectedHistoryLeaseHistory}
        handleCancelPaymentConfirmation={store.handleCancelPaymentConfirmation}
        setPaymentToValidate={store.setPaymentToValidate}
        paymentToValidate={store.paymentToValidate}
        setPaymentToValidateNull={() => store.setPaymentToValidate(null)}
        handleSavePaymentConfirmation={store.handleSavePaymentConfirmation}
        confirmStatus={store.confirmStatus}
        setConfirmStatus={store.setConfirmStatus}
        confirmAmount={store.confirmAmount}
        setConfirmAmount={store.setConfirmAmount}
        confirmDate={store.confirmDate}
        setConfirmDate={store.setConfirmDate}
        confirmMode={store.confirmMode}
        setConfirmMode={store.setConfirmMode}
        selectedStatementLease={store.selectedStatementLease}
        setSelectedStatementLease={store.setSelectedStatementLease}
        releveHistory={selectedStatementLeaseHistory}
        generateReleveHtml={store.generateReleveHtml}
        handleGenerateAndSaveReleve={store.handleGenerateAndSaveReleve}
        generatingReleveId={store.generatingReleveId}
      />
    </div>
  );
}
