import { useEffect, useState } from "react";
import api from "../api";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/dashboard/stats/");
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  // Prepare chart data
  const statusData = stats?.cases_by_status ? 
    Object.entries(stats.cases_by_status).map(([name, value]) => ({ name, value })) : [];
    
  const priorityData = stats?.cases_by_priority ?
    Object.entries(stats.cases_by_priority).map(([name, value]) => ({ name, value })) : [];
    
  const typeData = stats?.cases_by_type ?
    Object.entries(stats.cases_by_type).map(([name, value]) => ({ name, value })) : [];
    
  const assigneeData = stats?.cases_by_assignee ?
    stats.cases_by_assignee.map(item => ({ 
      name: item.assigned_to__username || 'Unassigned', 
      count: item.count 
    })) : [];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Cases</h3>
          <p className="stat-number">{stats?.total_cases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Open Cases</h3>
          <p className="stat-number">{stats?.cases_by_status?.Open || 0}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number">{stats?.cases_by_status?.['In Progress'] || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <p className="stat-number">{stats?.cases_by_status?.Resolved || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Case Status Distribution */}
        <div className="chart-card">
          <h3>Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

         {/* Cases by Priority */}
         <div className="chart-card">
           <h3>Cases by Priority</h3>
           <ResponsiveContainer width="100%" height={300}>
             <BarChart data={priorityData}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Legend />
               <Bar dataKey="value" fill="#0088FE" name="Cases" />
             </BarChart>
           </ResponsiveContainer>
         </div>

        {/* Cases by Type */}
        <div className="chart-card">
          <h3>Cases by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={120} 
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#FF8042" name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Assignee */}
        <div className="chart-card">
          <h3>Cases by Assignee</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assigneeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="recent-cases">
        <h3>Recent Cases</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Name</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recent_cases?.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>{caseItem.case_number}</td>
                <td>{caseItem.name}</td>
                <td>
                  <span className={`status-badge status-${caseItem.status.toLowerCase().replace(' ', '-')}`}>
                    {caseItem.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge priority-${caseItem.priority.toLowerCase()}`}>
                    {caseItem.priority}
                  </span>
                </td>
                <td>{new Date(caseItem.created_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
