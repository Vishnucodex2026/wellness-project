import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  LogOut,
  MessageCircle,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Users,
  Eye,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import {
  BusinessSettings,
  DashboardAppointment,
  DashboardLead,
  deleteAppointment,
  deleteLead,
  fetchAppointments,
  fetchBusinessSettings,
  fetchLeads,
  signInAdmin,
  signOutAdmin,
  updateAppointmentStatus,
  updateBusinessSettings,
  updateLead,
  verifyAdmin,
} from '@/lib/admin';

function Admin() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);

  const [viewLead, setViewLead] = useState<DashboardLead | null>(null);
  const [editLead, setEditLead] = useState<DashboardLead | null>(null);
  const [viewAppointment, setViewAppointment] =
    useState<DashboardAppointment | null>(null);

  const [tab, setTab] = useState<
    'overview' | 'leads' | 'appointments' | 'settings'
  >('overview');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setMessage('');

    try {
      const [nextLeads, nextAppointments, nextSettings] = await Promise.all([
        fetchLeads(),
        fetchAppointments(),
        fetchBusinessSettings(),
      ]);

      setLeads(nextLeads);
      setAppointments(nextAppointments);
      setSettings(nextSettings);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verifyAdmin().then(({ isAdmin }) => {
      setSignedIn(isAdmin);
      setReady(true);

      if (isAdmin) {
        void loadDashboard();
      }
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');

    const { error } = await signInAdmin(
      loginEmail.trim(),
      loginPassword
    );

    if (error) {
      setLoginError(error.message);
      return;
    }

    const result = await verifyAdmin();

    if (!result.isAdmin) {
      await signOutAdmin();
      setLoginError('This account is not authorized as an admin.');
      return;
    }

    setSignedIn(true);
    setLoginPassword('');
    void loadDashboard();
  }

  async function logout() {
    await signOutAdmin();
    setSignedIn(false);
  }

  async function changeStatus(id: string, status: string) {
    try {
      await updateAppointmentStatus(id, status);

      setAppointments((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );

      setMessage('Appointment status updated.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not update appointment.'
      );
    }
  }

  async function handleDeleteLead(id: string) {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      await deleteLead(id);

      setLeads((items) =>
        items.filter((lead) => lead.id !== id)
      );

      setSelectedLeads((items) =>
        items.filter((selectedId) => selectedId !== id)
      );

      setMessage('Lead deleted successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete lead.'
      );
    }
  }

  async function handleDeleteSelectedLeads() {
    if (!selectedLeads.length) {
      setMessage('Please select at least one lead.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedLeads.length} selected lead(s)?`
      )
    ) {
      return;
    }

    try {
      for (const id of selectedLeads) {
        await deleteLead(id);
      }

      setLeads((items) =>
        items.filter((lead) => !selectedLeads.includes(lead.id))
      );

      setSelectedLeads([]);
      setMessage('Selected leads deleted successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete selected leads.'
      );
    }
  }

  async function handleSaveLead(updatedLead: DashboardLead) {
    try {
      const saved = await updateLead(updatedLead.id, {
        full_name: updatedLead.full_name,
        phone: updatedLead.phone,
        email: updatedLead.email,
        city: updatedLead.city,
        age: updatedLead.age,
        weight: updatedLead.weight,
        height: updatedLead.height,
        gender: updatedLead.gender,
        main_goal: updatedLead.main_goal,
        language: updatedLead.language,
      });

      setLeads((items) =>
        items.map((lead) =>
          lead.id === saved.id ? saved : lead
        )
      );

      setEditLead(null);
      setMessage('Lead updated successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to update lead.'
      );
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (
      !window.confirm(
        'Are you sure you want to delete this appointment?'
      )
    ) {
      return;
    }

    try {
      await deleteAppointment(id);

      setAppointments((items) =>
        items.filter((appointment) => appointment.id !== id)
      );

      setSelectedAppointments((items) =>
        items.filter((selectedId) => selectedId !== id)
      );

      setMessage('Appointment deleted successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete appointment.'
      );
    }
  }

  async function handleDeleteSelectedAppointments() {
    if (!selectedAppointments.length) {
      setMessage('Please select at least one appointment.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedAppointments.length} selected appointment(s)?`
      )
    ) {
      return;
    }

    try {
      for (const id of selectedAppointments) {
        await deleteAppointment(id);
      }

      setAppointments((items) =>
        items.filter(
          (appointment) =>
            !selectedAppointments.includes(appointment.id)
        )
      );

      setSelectedAppointments([]);
      setMessage('Selected appointments deleted successfully.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete selected appointments.'
      );
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-center">
        Loading…
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Be Honest With Yourself
            </p>
          </div>

          <label
            className="mb-2 block text-sm font-semibold text-slate-700"
            htmlFor="admin-email"
          >
            Email
          </label>

          <input
            id="admin-email"
            type="email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="mb-4 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />

          <label
            className="mb-2 block text-sm font-semibold text-slate-700"
            htmlFor="admin-password"
          >
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />

          {loginError && (
            <p
              className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {loginError}
            </p>
          )}

          <button className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <h1 className="text-xl font-bold">
              🌱 Business Dashboard
            </h1>

            <p className="text-xs text-slate-500">
              Be Honest With Yourself
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>

            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <LogOut
                className="h-4 w-4"
                aria-hidden="true"
              />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <nav
          className="mb-6 flex flex-wrap gap-2"
          aria-label="Admin sections"
        >
          {(
            [
              ['overview', 'Overview'],
              ['leads', 'Leads'],
              ['appointments', 'Appointments'],
              ['settings', 'Settings'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                tab === key
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <div
            className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
            role="status"
          >
            {message}
          </div>
        )}

        {loading && (
          <p className="mb-4 text-sm text-slate-500">
            Refreshing…
          </p>
        )}

        {tab === 'overview' && (
          <Overview
            leads={leads}
            appointments={appointments}
          />
        )}

        {tab === 'leads' && (
          <Leads
            leads={leads}
            selectedLeads={selectedLeads}
            onSelect={(id) =>
              setSelectedLeads((items) =>
                items.includes(id)
                  ? items.filter((item) => item !== id)
                  : [...items, id]
              )
            }
            onSelectAll={() =>
              setSelectedLeads(
                selectedLeads.length === leads.length
                  ? []
                  : leads.map((lead) => lead.id)
              )
            }
            onView={setViewLead}
            onEdit={setEditLead}
            onDelete={(id) => void handleDeleteLead(id)}
            onDeleteSelected={() =>
              void handleDeleteSelectedLeads()
            }
          />
        )}

        {tab === 'appointments' && (
          <Appointments
            appointments={appointments}
            selectedAppointments={selectedAppointments}
            onSelect={(id) =>
              setSelectedAppointments((items) =>
                items.includes(id)
                  ? items.filter((item) => item !== id)
                  : [...items, id]
              )
            }
            onSelectAll={() =>
              setSelectedAppointments(
                selectedAppointments.length === appointments.length
                  ? []
                  : appointments.map(
                      (appointment) => appointment.id
                    )
              )
            }
            onStatus={changeStatus}
            onView={setViewAppointment}
            onDelete={(id) =>
              void handleDeleteAppointment(id)
            }
            onDeleteSelected={() =>
              void handleDeleteSelectedAppointments()
            }
          />
        )}

        {tab === 'settings' && settings && (
          <SettingsPanel
            settings={settings}
            onSaved={(next) => {
              setSettings(next);
              setMessage('Settings saved.');
            }}
          />
        )}
      </div>

      {viewLead && (
        <LeadViewModal
          lead={viewLead}
          onClose={() => setViewLead(null)}
        />
      )}

      {editLead && (
        <LeadEditModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSave={handleSaveLead}
        />
      )}

      {viewAppointment && (
        <AppointmentViewModal
          appointment={viewAppointment}
          onClose={() => setViewAppointment(null)}
        />
      )}
    </main>
  );
}

function Overview({
  leads,
  appointments,
}: {
  leads: DashboardLead[];
  appointments: DashboardAppointment[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const newToday = leads.filter(
    (x) => x.created_at.slice(0, 10) === today
  ).length;

  const pending = appointments.filter(
    (x) => x.status === 'new'
  ).length;

  const cards = [
    ['Total Leads', leads.length, Users],
    [
      'Appointments',
      appointments.filter(
        (x) => x.request_type === 'appointment'
      ).length,
      CalendarDays,
    ],
    ['New Today', newToday, Clock3],
    ['Pending', pending, MessageCircle],
  ] as const;

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">
        Welcome 👋
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Icon
              className="mb-3 h-6 w-6 text-emerald-600"
              aria-hidden="true"
            />

            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="mt-1 text-3xl font-bold">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-bold">
          Recent leads
        </h3>

        <LeadsTable
          leads={leads.slice(0, 8)}
          selectedLeads={[]}
          onSelect={() => undefined}
          onSelectAll={() => undefined}
          onView={() => undefined}
          onEdit={() => undefined}
          onDelete={() => undefined}
          onDeleteSelected={() => undefined}
          compact
        />
      </div>
    </>
  );
}

function Leads({
  leads,
  selectedLeads,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onDeleteSelected,
}: {
  leads: DashboardLead[];
  selectedLeads: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (lead: DashboardLead) => void;
  onEdit: (lead: DashboardLead) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
}) {
  const allSelected =
    leads.length > 0 &&
    selectedLeads.length === leads.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Leads
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Customer submissions from your assessment.
          </p>
        </div>

        <button
          onClick={onDeleteSelected}
          disabled={!selectedLeads.length}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2
            className="h-4 w-4"
            aria-hidden="true"
          />
          Delete Selected ({selectedLeads.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <LeadsTable
          leads={leads}
          selectedLeads={selectedLeads}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDeleteSelected={onDeleteSelected}
          compact={false}
          allSelected={allSelected}
        />
      </div>
    </section>
  );
}

function LeadsTable({
  leads,
  selectedLeads,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  compact,
  allSelected = false,
}: {
  leads: DashboardLead[];
  selectedLeads: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (lead: DashboardLead) => void;
  onEdit: (lead: DashboardLead) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
  compact: boolean;
  allSelected?: boolean;
}) {
  if (!leads.length) {
    return (
      <p className="py-8 text-center text-slate-500">
        No leads yet.
      </p>
    );
  }

  return (
    <table className="w-full min-w-[1050px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
          {!compact && (
            <th className="px-3 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                aria-label="Select all leads"
              />
            </th>
          )}

          <th className="px-3 py-3">
            Name
          </th>

          <th className="px-3 py-3">
            Phone
          </th>

          {!compact && (
            <>
              <th className="px-3 py-3">
                Email
              </th>

              <th className="px-3 py-3">
                City
              </th>
            </>
          )}

          <th className="px-3 py-3">
            Goal
          </th>

          <th className="px-3 py-3">
            Score
          </th>

          <th className="px-3 py-3">
            Readiness
          </th>

          <th className="px-3 py-3">
            Date
          </th>

          {!compact && (
            <th className="px-3 py-3">
              Actions
            </th>
          )}
        </tr>
      </thead>

      <tbody>
        {leads.map((lead) => (
          <tr
            key={lead.id}
            className="border-b border-slate-100"
          >
            {!compact && (
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => onSelect(lead.id)}
                  aria-label={`Select ${lead.full_name}`}
                />
              </td>
            )}

            <td className="px-3 py-3 font-semibold">
              {lead.full_name}
            </td>

            <td className="px-3 py-3">
              {lead.phone}
            </td>

            {!compact && (
              <>
                <td className="px-3 py-3">
                  {lead.email || '—'}
                </td>

                <td className="px-3 py-3">
                  {lead.city || '—'}
                </td>
              </>
            )}

            <td className="px-3 py-3">
              {lead.main_goal || '—'}
            </td>

            <td className="px-3 py-3 font-bold">
              {lead.overall_score}/100
            </td>

            <td className="px-3 py-3">
              {lead.readiness}/10
            </td>

            <td className="px-3 py-3">
              {new Date(
                lead.created_at
              ).toLocaleString()}
            </td>

            {!compact && (
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(lead)}
                    className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                    aria-label={`View ${lead.full_name}`}
                    title="View"
                  >
                    <Eye
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    onClick={() => onEdit(lead)}
                    className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                    aria-label={`Edit ${lead.full_name}`}
                    title="Edit"
                  >
                    <Pencil
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    onClick={() => onDelete(lead.id)}
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${lead.full_name}`}
                    title="Delete"
                  >
                    <Trash2
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Appointments({
  appointments,
  selectedAppointments,
  onSelect,
  onSelectAll,
  onStatus,
  onView,
  onDelete,
  onDeleteSelected,
}: {
  appointments: DashboardAppointment[];
  selectedAppointments: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onStatus: (id: string, status: string) => void;
  onView: (appointment: DashboardAppointment) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
}) {
  const allSelected =
    appointments.length > 0 &&
    selectedAppointments.length === appointments.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Appointments & callbacks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage appointment and callback requests.
          </p>
        </div>

        <button
          onClick={onDeleteSelected}
          disabled={!selectedAppointments.length}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2
            className="h-4 w-4"
            aria-hidden="true"
          />
          Delete Selected ({selectedAppointments.length})
        </button>
      </div>

      {!appointments.length ? (
        <p className="py-8 text-center text-slate-500">
          No requests yet.
        </p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              aria-label="Select all appointments"
            />

            <span className="text-sm font-semibold">
              Select all appointments
            </span>
          </div>

          <div className="space-y-4">
            {appointments.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="flex gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedAppointments.includes(
                          item.id
                        )}
                        onChange={() => onSelect(item.id)}
                        aria-label={`Select appointment from ${item.full_name}`}
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-bold">
                          {item.full_name}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                          {item.request_type}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        📱 {item.phone}
                        {item.email
                          ? ` • ${item.email}`
                          : ''}
                      </p>

                      {item.preferred_date && (
                        <p className="mt-2 text-sm font-semibold">
                          📅 {item.preferred_date}
                          {item.preferred_time
                            ? ` at ${item.preferred_time}`
                            : ''}
                        </p>
                      )}

                      {item.notes && (
                        <p className="mt-2 text-sm text-slate-600">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={`status-${item.id}`}
                      className="sr-only"
                    >
                      Status
                    </label>

                    <select
                      id={`status-${item.id}`}
                      value={item.status}
                      onChange={(e) =>
                        onStatus(
                          item.id,
                          e.target.value
                        )
                      }
                      className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold"
                    >
                      <option value="new">
                        New
                      </option>
                      <option value="confirmed">
                        Confirmed
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>

                    <button
                      onClick={() => onView(item)}
                      className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
                      aria-label={`View appointment from ${item.full_name}`}
                      title="View"
                    >
                      <Eye
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50"
                      aria-label={`Delete appointment from ${item.full_name}`}
                      title="Delete"
                    >
                      <Trash2
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function LeadViewModal({
  lead,
  onClose,
}: {
  lead: DashboardLead;
  onClose: () => void;
}) {
  return (
    <Modal title="Lead Details" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Name" value={lead.full_name} />
        <Detail label="Phone" value={lead.phone} />
        <Detail label="Email" value={lead.email} />
        <Detail label="City" value={lead.city} />
        <Detail label="Age" value={lead.age} />
        <Detail label="Weight" value={lead.weight} />
        <Detail label="Height" value={lead.height} />
        <Detail label="Gender" value={lead.gender} />
        <Detail label="Main Goal" value={lead.main_goal} />
        <Detail label="Language" value={lead.language} />
        <Detail
          label="Overall Score"
          value={`${lead.overall_score}/100`}
        />
        <Detail
          label="Readiness"
          value={`${lead.readiness}/10`}
        />
        <Detail
          label="Created"
          value={new Date(
            lead.created_at
          ).toLocaleString()}
        />
      </div>
    </Modal>
  );
}

function LeadEditModal({
  lead,
  onClose,
  onSave,
}: {
  lead: DashboardLead;
  onClose: () => void;
  onSave: (lead: DashboardLead) => Promise<void>;
}) {
  const [form, setForm] = useState(lead);
  const [saving, setSaving] = useState(false);

  function setField(
    key: keyof DashboardLead,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function save() {
    setSaving(true);

    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Lead" onClose={onClose}>
      <div className="space-y-4">
        <Field
          label="Name"
          value={form.full_name}
          onChange={(value) =>
            setField('full_name', value)
          }
        />

        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) =>
            setField('phone', value)
          }
        />

        <Field
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(value) =>
            setField('email', value)
          }
        />

        <Field
          label="City"
          value={form.city || ''}
          onChange={(value) =>
            setField('city', value)
          }
        />

        <Field
          label="Age"
          value={form.age}
          onChange={(value) =>
            setField('age', value)
          }
        />

        <Field
          label="Weight"
          value={form.weight || ''}
          onChange={(value) =>
            setField('weight', value)
          }
        />

        <Field
          label="Height"
          value={form.height || ''}
          onChange={(value) =>
            setField('height', value)
          }
        />

        <Field
          label="Gender"
          value={form.gender || ''}
          onChange={(value) =>
            setField('gender', value)
          }
        />

        <Field
          label="Main Goal"
          value={form.main_goal || ''}
          onChange={(value) =>
            setField('main_goal', value)
          }
        />

        <Field
          label="Language"
          value={form.language || ''}
          onChange={(value) =>
            setField('language', value)
          }
        />

        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p>
            <strong>Overall Score:</strong>{' '}
            {form.overall_score}/100
          </p>

          <p className="mt-1">
            <strong>Readiness:</strong>{' '}
            {form.readiness}/10
          </p>

          <p className="mt-2 text-slate-500">
            Calculated scores are not manually editable.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={() => void save()}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AppointmentViewModal({
  appointment,
  onClose,
}: {
  appointment: DashboardAppointment;
  onClose: () => void;
}) {
  return (
    <Modal title="Appointment Details" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail
          label="Name"
          value={appointment.full_name}
        />

        <Detail
          label="Phone"
          value={appointment.phone}
        />

        <Detail
          label="Email"
          value={appointment.email}
        />

        <Detail
          label="Request Type"
          value={appointment.request_type}
        />

        <Detail
          label="Preferred Date"
          value={appointment.preferred_date}
        />

        <Detail
          label="Preferred Time"
          value={appointment.preferred_time}
        />

        <Detail
          label="Language"
          value={appointment.language}
        />

        <Detail
          label="Status"
          value={appointment.status}
        />

        <div className="sm:col-span-2">
          <Detail
            label="Notes"
            value={appointment.notes}
          />
        </div>

        <div className="sm:col-span-2">
          <Detail
            label="Created"
            value={new Date(
              appointment.created_at
            ).toLocaleString()}
          />
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Close"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value || '—'}
      </p>
    </div>
  );
}

function SettingsPanel({
  settings,
  onSaved,
}: {
  settings: BusinessSettings;
  onSaved: (settings: BusinessSettings) => void;
}) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');

    try {
      const next = await updateBusinessSettings(form);
      onSaved(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not save settings.'
      );
    } finally {
      setSaving(false);
    }
  }

  const set = (
    key: keyof BusinessSettings,
    value: string
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  return (
    <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <Settings
          className="h-6 w-6 text-emerald-600"
          aria-hidden="true"
        />

        <div>
          <h2 className="text-2xl font-bold">
            Business settings
          </h2>

          <p className="text-sm text-slate-500">
            Change your contact details without editing code.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field
          label="Business name"
          value={form.business_name}
          onChange={(v) =>
            set('business_name', v)
          }
        />

        <Field
          label="Your name"
          value={form.owner_name}
          onChange={(v) =>
            set('owner_name', v)
          }
        />

        <Field
          label="WhatsApp number"
          value={form.whatsapp_number}
          onChange={(v) =>
            set('whatsapp_number', v)
          }
          placeholder="Country code + number, digits only"
        />

        <Field
          label="Business email"
          type="email"
          value={form.business_email}
          onChange={(v) =>
            set('business_email', v)
          }
        />

        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="wa-message"
          >
            WhatsApp message
          </label>

          <textarea
            id="wa-message"
            rows={4}
            value={form.whatsapp_message}
            onChange={(e) =>
              set(
                'whatsapp_message',
                e.target.value
              )
            }
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        onClick={() => void save()}
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save
          className="h-4 w-4"
          aria-hidden="true"
        />

        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold"
        htmlFor={`field-${label}`}
      >
        {label}
      </label>

      <input
        id={`field-${label}`}
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

export default Admin;