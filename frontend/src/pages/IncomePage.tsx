import Layout from '../components/Layout';

export default function IncomePage() {
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-cash-coin me-2 text-success"></i>
          Income
        </h1>
        <button className="btn btn-success">
          <i className="bi bi-plus-circle me-1"></i>
          Add Income
        </button>
      </div>

      <div className="text-center py-5">
        <i className="bi bi-cash-coin text-muted" style={{ fontSize: '4rem' }}></i>
        <h3 className="text-muted mt-3">Income tracking coming soon</h3>
        <p className="text-muted">This feature is under development and will be available soon.</p>
      </div>
    </Layout>
  );
}