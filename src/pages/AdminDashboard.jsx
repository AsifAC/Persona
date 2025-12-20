// Admin Dashboard - Database permissions and RLS policy checker
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { isVerifier } from '../utils/admin'
import { submissionService } from '../services/submissionService'
import { supabase } from '../config/supabase'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [policies, setPolicies] = useState([])
  const [tableStats, setTableStats] = useState({})
  const [error, setError] = useState('')
  const [pendingSubmissions, setPendingSubmissions] = useState([])
  const [submissionError, setSubmissionError] = useState('')
  const [submissionLoading, setSubmissionLoading] = useState(false)

  const loadTableStats = useCallback(async (tableList) => {
    const stats = {}
    for (const table of tableList) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error && count !== null) {
          stats[table] = count
        }
      } catch {
        stats[table] = 'N/A'
      }
    }
    setTableStats(stats)
  }, [])

  const loadDatabaseInfo = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Use known tables list (since we can't query information_schema directly)
      const knownTables = [
        'profiles',
        'search_queries',
        'person_profiles',
        'search_results',
        'addresses',
        'phone_numbers',
        'social_media',
        'criminal_records',
        'relatives',
        'search_history',
        'favorite_searches'
      ]
      
      setTables(knownTables)

      // Load table statistics
      await loadTableStats(knownTables)
    } catch (err) {
      console.error('Error loading database info:', err)
      setError('Failed to load database information. Make sure you have proper permissions.')
    } finally {
      setLoading(false)
    }
  }, [loadTableStats])

  const loadPendingSubmissions = useCallback(async () => {
    try {
      setSubmissionLoading(true)
      setSubmissionError('')
      const data = await submissionService.getPendingSubmissions()
      setPendingSubmissions(data)
    } catch (err) {
      console.error('Error loading submissions:', err)
      setSubmissionError('Unable to load submissions.')
    } finally {
      setSubmissionLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDatabaseInfo()
  }, [loadDatabaseInfo])

  useEffect(() => {
    if (isVerifier(user)) {
      loadPendingSubmissions()
    }
  }, [loadPendingSubmissions, user])

  const handleSubmissionAction = async (submissionId, status) => {
    try {
      setSubmissionLoading(true)
      await submissionService.updateSubmissionStatus(submissionId, status)
      await loadPendingSubmissions()
    } catch (err) {
      console.error('Error updating submission:', err)
      setSubmissionError('Failed to update submission.')
    } finally {
      setSubmissionLoading(false)
    }
  }

  const loadPoliciesForTable = async (tableName) => {
    try {
      setLoading(true)
      setError('')

      // Since we can't directly query pg_policies via Supabase client,
      // we'll provide the SQL query for the user to run in Supabase SQL Editor
      setPolicies([
        {
          note: 'To view detailed RLS policies, run this query in Supabase SQL Editor:',
          query: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = '${tableName}' ORDER BY cmd, policyname;`,
          tableName: tableName
        }
      ])
    } catch (err) {
      console.error('Error loading policies:', err)
      setError('Unable to load policies. Use Supabase SQL Editor to query pg_policies directly.')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName)
    loadPoliciesForTable(tableName)
  }

  return (
    <div className="admin-dashboard-container">
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h1>🔒 Admin Dashboard</h1>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="admin-section">
          <h2>Database Overview</h2>
          <div className="admin-info">
            <p><strong>Admin User:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </div>

        {error && (
          <div className="admin-error">
            {error}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Note: Some database information requires direct SQL access. 
              Use Supabase SQL Editor for detailed policy information.
            </p>
          </div>
        )}

        <div className="admin-section">
          <h2>Database Tables & RLS Status</h2>
          <div className="tables-grid">
            {tables.map((table) => (
              <div 
                key={table} 
                className={`table-card ${selectedTable === table ? 'selected' : ''}`}
                onClick={() => handleTableSelect(table)}
              >
                <h3>{table}</h3>
                <p className="table-stats">
                  Rows: {tableStats[table] !== undefined ? tableStats[table] : 'Loading...'}
                </p>
                <button 
                  className="view-policies-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTableSelect(table)
                  }}
                >
                  View Policies
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedTable && (
          <div className="admin-section">
            <h2>RLS Policies for: {selectedTable}</h2>
            {loading ? (
              <p>Loading policies...</p>
            ) : policies.length > 0 ? (
              <div className="policies-list">
                {policies.map((policy, index) => (
                  <div key={index} className="policy-card">
                    {policy.policyname ? (
                      <>
                        <h3>{policy.policyname}</h3>
                        <p><strong>Operation:</strong> {policy.cmd}</p>
                        {policy.qual && (
                          <p><strong>USING:</strong> <code>{policy.qual}</code></p>
                        )}
                        {policy.with_check && (
                          <p><strong>WITH CHECK:</strong> <code>{policy.with_check}</code></p>
                        )}
                      </>
                    ) : (
                      <div>
                        <p>{policy.note}</p>
                        <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: '#f5f5f5' }}>
                          {policy.query}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No policies found or unable to load policies.</p>
            )}
            <div className="admin-actions">
              <button 
                onClick={() => window.open(`https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/sql`, '_blank')}
                className="sql-editor-btn"
              >
                Open Supabase SQL Editor
              </button>
              <button 
                onClick={() => {
                  const query = `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = '${selectedTable}';`
                  navigator.clipboard.writeText(query)
                  alert('SQL query copied to clipboard!')
                }}
                className="copy-query-btn"
              >
                Copy Policy Query
              </button>
            </div>
          </div>
        )}

        <div className="admin-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button 
              onClick={() => {
                const query = `SELECT tablename, policyname, cmd FROM pg_policies ORDER BY tablename, cmd;`
                navigator.clipboard.writeText(query)
                alert('Query to view all policies copied to clipboard!')
              }}
            >
              Copy All Policies Query
            </button>
            <button 
              onClick={() => {
                const query = `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
                navigator.clipboard.writeText(query)
                alert('Query to view all tables copied to clipboard!')
              }}
            >
              Copy All Tables Query
            </button>
            <button 
              onClick={() => {
                window.open('https://app.supabase.com', '_blank')
              }}
            >
              Open Supabase Dashboard
            </button>
          </div>
        </div>

        {isVerifier(user) && (
          <div className="admin-section">
            <h2>Pending Verification Submissions</h2>
            {submissionError && (
              <div className="admin-error">{submissionError}</div>
            )}
            {submissionLoading ? (
              <p>Loading submissions...</p>
            ) : pendingSubmissions.length === 0 ? (
              <p>No pending submissions.</p>
            ) : (
              <div className="policies-list">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="policy-card">
                    <h3>{submission.first_name} {submission.last_name}</h3>
                    <p><strong>Submitted by:</strong> {submission.user_id}</p>
                    <p><strong>Submitted at:</strong> {new Date(submission.created_at).toLocaleString()}</p>
                    {submission.age && <p><strong>Age:</strong> {submission.age}</p>}
                    <div className="admin-actions">
                      <button
                        onClick={() => handleSubmissionAction(submission.id, 'approved')}
                        className="view-policies-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSubmissionAction(submission.id, 'rejected')}
                        className="copy-query-btn"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

