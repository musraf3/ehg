import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  ClipboardCheck,
  CalendarDays,
  FileText,
  ArrowRight,
  CalendarClock,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'

const STATUS_META = {
  DRAFT: {
    badge:
      'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    color: '#64748B',
  },
  PREPARATION: {
    badge:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    color: '#F59E0B',
  },
  IN_PROGRESS: {
    badge:
      'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    color: '#2F8CC9',
  },
  REVIEW: {
    badge:
      'bg-purple-50 text-[#6B3A98] ring-1 ring-purple-200',
    color: '#6B3A98',
  },
  SUBMITTED: {
    badge:
      'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    color: '#4F46E5',
  },
  COMPLETED: {
    badge:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    color: '#16A34A',
  },
  CANCELLED: {
    badge:
      'bg-red-50 text-red-700 ring-1 ring-red-200',
    color: '#DC2626',
  },
}

const ACCENT_META = {
  blue: {
    icon: 'bg-sky-50 text-[#2F8CC9]',
    trend: 'text-[#2F8CC9]',
  },
  purple: {
    icon: 'bg-purple-50 text-[#6B3A98]',
    trend: 'text-[#6B3A98]',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    trend: 'text-amber-600',
  },
  red: {
    icon: 'bg-red-50 text-red-600',
    trend: 'text-red-600',
  },
}

const URGENCY_META = {
  overdue: {
    dot: 'bg-red-500',
    text: 'text-red-600',
    label: 'Overdue',
  },
  critical: {
    dot: 'bg-red-500',
    text: 'text-red-600',
    label: 'Due soon',
  },
  warning: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    label: 'Upcoming',
  },
  normal: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    label: 'On track',
  },
}

const formatStatus = (status) => {
  if (!status) return 'Draft'

  return status
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'No deadline'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const getDeadlineInfo = (deadline) => {
  if (!deadline) {
    return {
      daysRemaining: null,
      urgency: 'normal',
    }
  }

  const today = new Date()
  const deadlineDate = new Date(deadline)

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      daysRemaining: null,
      urgency: 'normal',
    }
  }

  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)

  const millisecondsPerDay =
    1000 * 60 * 60 * 24

  const daysRemaining = Math.ceil(
    (deadlineDate - today) /
      millisecondsPerDay
  )

  let urgency = 'normal'

  if (daysRemaining < 0) {
    urgency = 'overdue'
  } else if (daysRemaining <= 3) {
    urgency = 'critical'
  } else if (daysRemaining <= 7) {
    urgency = 'warning'
  }

  return {
    daysRemaining,
    urgency,
  }
}

const EmployeeDashboard = () => {
  const navigate = useNavigate()

  const [assignedTenders, setAssignedTenders] =
    useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAssignedTenders = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        '/tenders/assigned'
      )

      setAssignedTenders(
        response.data.tenders || []
      )
    } catch (error) {
      setAssignedTenders([])

      setError(
        error.response?.data?.message ||
          'Unable to load your assigned tenders.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignedTenders()
  }, [])

  const activeTenders = useMemo(() => {
    return assignedTenders.filter(
      (tender) =>
        ![
          'COMPLETED',
          'CANCELLED',
        ].includes(tender.status)
    )
  }, [assignedTenders])

  const upcomingDeadlines = useMemo(() => {
    return activeTenders
      .filter((tender) => tender.deadline)
      .map((tender) => ({
        ...tender,
        ...getDeadlineInfo(tender.deadline),
      }))
      .sort((a, b) => {
        return (
          new Date(a.deadline) -
          new Date(b.deadline)
        )
      })
  }, [activeTenders])

  const deadlinesWithinSevenDays =
    useMemo(() => {
      return upcomingDeadlines.filter(
        (tender) =>
          tender.daysRemaining !== null &&
          tender.daysRemaining >= 0 &&
          tender.daysRemaining <= 7
      ).length
    }, [upcomingDeadlines])

  const stats = useMemo(
    () => [
      {
        title: 'Assigned Tenders',
        value: assignedTenders.length,
        description:
          'Currently assigned to you',
        icon: BriefcaseBusiness,
        accent: 'blue',
        trend:
          assignedTenders.length === 1
            ? '1 tender'
            : `${assignedTenders.length} tenders`,
      },
      {
        title: 'Active Tenders',
        value: activeTenders.length,
        description:
          'Work currently in progress',
        icon: ClipboardCheck,
        accent: 'purple',
        trend:
          activeTenders.length > 0
            ? 'Requires attention'
            : 'No active work',
      },
      {
        title: 'Upcoming Deadlines',
        value: deadlinesWithinSevenDays,
        description:
          'Due within the next 7 days',
        icon: CalendarDays,
        accent: 'red',
        trend:
          deadlinesWithinSevenDays > 0
            ? 'Check deadlines'
            : 'Nothing urgent',
      },
      {
        title: 'My Documents',
        value: '—',
        description:
          'Document module coming next',
        icon: FileText,
        accent: 'amber',
        trend: 'Milestone 2',
      },
    ],
    [
      assignedTenders.length,
      activeTenders.length,
      deadlinesWithinSevenDays,
    ]
  )

  const dashboardTenders = useMemo(() => {
    return assignedTenders.slice(0, 3)
  }, [assignedTenders])

  const dashboardDeadlines = useMemo(() => {
    return upcomingDeadlines.slice(0, 4)
  }, [upcomingDeadlines])

  const myTasks = [
    {
      label: 'Assigned Tenders',
      description: `${assignedTenders.length} assigned to you`,
      icon: BriefcaseBusiness,
      route: '/employee/assigned-tenders',
      accent:
        'bg-sky-50 text-[#2F8CC9]',
    },
    // {
    //   label: 'Compliance Checklist',
    //   description:
    //     'Available in the workflow phase',
    //   icon: ClipboardCheck,
    //   route: '/employee/compliance',
    //   accent:
    //     'bg-amber-50 text-amber-600',
    // },
    // {
    //   label: 'My Documents',
    //   description:
    //     'Document management module',
    //   icon: FileText,
    //   route: '/employee/documents',
    //   accent:
    //     'bg-purple-50 text-[#6B3A98]',
    // },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            My Workspace
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Employee Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track your assigned tenders and
            upcoming deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

            <div>
              <p className="text-xs text-slate-400">
                Work status
              </p>

              <p className="text-sm font-semibold text-slate-900">
                Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAssignedTenders}
            disabled={loading}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh dashboard"
          >
            <RefreshCw
              size={18}
              className={
                loading ? 'animate-spin' : ''
              }
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const accent =
            ACCENT_META[stat.accent]

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-950">
                    {loading
                      ? '—'
                      : stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}
                >
                  <Icon size={21} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-slate-400">
                  {stat.description}
                </p>

                <p
                  className={`shrink-0 text-xs font-semibold ${accent.trend}`}
                >
                  {loading
                    ? 'Loading...'
                    : stat.trend}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assigned Tenders + Tasks */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                My Assigned Tenders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tenders currently assigned to
                your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/employee/assigned-tenders'
                )
              }
              className="flex min-h-[44px] w-fit shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#6B3A98]"
            >
              View all
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-[#6B3A98]"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading your tenders...
                </p>
              </div>
            </div>
          ) : dashboardTenders.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <BriefcaseBusiness size={22} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No assigned tenders
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You currently have no tenders
                assigned to your account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboardTenders.map(
                (tender) => {
                  const statusMeta =
                    STATUS_META[
                      tender.status
                    ] ||
                    STATUS_META.DRAFT

                  const deadlineInfo =
                    getDeadlineInfo(
                      tender.deadline
                    )

                  const urgency =
                    URGENCY_META[
                      deadlineInfo.urgency
                    ]

                  const progress = Math.min(
                    Math.max(
                      Number(
                        tender.progress
                      ) || 0,
                      0
                    ),
                    100
                  )

                  return (
                    <div
                      key={tender.id}
                      className="px-5 py-5 sm:px-6"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-slate-900">
                            {tender.title}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            {tender.referenceNo}
                          </p>

                          {tender.clientName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                tender.clientName
                              }
                            </p>
                          )}
                        </div>

                        <span
                          className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                        >
                          {formatStatus(
                            tender.status
                          )}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <CalendarDays
                            size={16}
                          />

                          Deadline:{' '}
                          {formatDate(
                            tender.deadline
                          )}
                        </span>

                        {deadlineInfo.daysRemaining !==
                          null && (
                          <span
                            className={`flex items-center gap-1.5 text-xs font-semibold ${urgency.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${urgency.dot}`}
                            />

                            {deadlineInfo.daysRemaining <
                            0
                              ? `${Math.abs(
                                  deadlineInfo.daysRemaining
                                )}d overdue`
                              : deadlineInfo.daysRemaining ===
                                  0
                                ? 'Due today'
                                : `${deadlineInfo.daysRemaining}d remaining`}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-xs text-slate-500">
                          <span>Progress</span>

                          <span>
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              backgroundColor:
                                statusMeta.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            My Tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quick access to your workspace.
          </p>

          <div className="mt-6 space-y-3">
            {myTasks.map((task) => {
              const Icon = task.icon

              return (
                <button
                  key={task.route}
                  type="button"
                  onClick={() =>
                    navigate(task.route)
                  }
                  className="flex min-h-[64px] w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${task.accent}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {task.label}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-400"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Deadlines + Activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                My Deadlines
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                What's due next on your
                assigned work.
              </p>
            </div>

            <CalendarClock
              size={20}
              className="shrink-0 text-slate-400"
            />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <RefreshCw
                size={22}
                className="animate-spin text-[#6B3A98]"
              />
            </div>
          ) : dashboardDeadlines.length ===
            0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarDays
                size={25}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No upcoming deadlines
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Assigned tender deadlines will
                appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dashboardDeadlines.map(
                (tender) => {
                  const urgency =
                    URGENCY_META[
                      tender.urgency
                    ]

                  return (
                    <li
                      key={tender.id}
                      className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${urgency.dot}`}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {tender.title}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(
                              tender.deadline
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold ${urgency.text}`}
                        >
                          {tender.daysRemaining <
                          0
                            ? `${Math.abs(
                                tender.daysRemaining
                              )}d`
                            : tender.daysRemaining ===
                                0
                              ? 'Today'
                              : `${tender.daysRemaining}d`}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          {urgency.label}
                        </p>
                      </div>
                    </li>
                  )
                }
              )}
            </ul>
          )}
        </div>

        {/* Activity placeholder */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest activity on your
                assigned work.
              </p>
            </div>

            <Activity
              size={20}
              className="shrink-0 text-slate-400"
            />
          </div>

          <div className="flex min-h-48 items-center justify-center px-6 py-10">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#6B3A98]">
                <Activity size={20} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                Activity tracking is coming
                next
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Tender comments, document
                uploads and workflow activity
                will appear here as those
                modules are implemented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard