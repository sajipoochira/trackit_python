import Layout from '../components/Layout';

export default function AssetsPage() {
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">
          <i className="bi bi-house me-2 text-info"></i>
          Assets
        </h1>
        <button className="btn btn-info">
          <i className="bi bi-plus-circle me-1"></i>
          Add Asset
        </button>
      </div>

      <div className="text-center py-5">
        <i className="bi bi-house text-muted" style={{ fontSize: '4rem' }}></i>
        <h3 className="text-muted mt-3">Asset tracking coming soon</h3>
        <p className="text-muted">This feature is under development and will be available soon.</p>
      </div>
    </Layout>
  );
}