function ClientTracker() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchStatus = () => {
    API.get(`/tasks/public/${token}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  // Check if any document task has an uploaded file
  const uploadedTask = data?.tasks?.find(
    (t: any) => t.fileUrl || (t.title === 'Documents Uploaded' && t.status === 'Completed')
  );

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setFeedbackMsg('');

    try {
      await API.post(`/tasks/upload/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedbackMsg('Document successfully saved!');
      setFile(null);
      setIsEditing(false);
      fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
        <p className="text-slate-400 text-sm">Loading Client Tax Status...</p>
      </div>
    );
  }

  if (!data || !data.client) {
    return <div className="p-12 text-center text-rose-400">Invalid or Expired Tracking Link</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Client Header Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{data.client.name}</h1>
          <p className="text-slate-400 text-xs mt-1">
            Service: <span className="text-emerald-400 font-medium">{data.client.serviceType || 'ITR Filing'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">PAN Number</p>
          <p className="font-mono text-sm font-bold text-slate-200">{data.client.panNumber}</p>
        </div>
      </div>

      {/* Uploaded File View & Edit Section */}
      {uploadedTask && uploadedTask.fileUrl && !isEditing ? (
        <div className="bg-slate-800 border border-emerald-500/40 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={18} /> Document Successfully Uploaded
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              ✏️ Replace / Edit File
            </button>
          </div>

          <p className="text-slate-400 text-xs mb-4">
            Aapka document hamare pass receive ho chuka hai. Agar galat file select ho gayi ho toh aap upar <strong>Replace / Edit</strong> button se dobara upload kar sakte hain.
          </p>

          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-emerald-400" size={28} />
              <div>
                <p className="text-white text-xs font-semibold">{uploadedTask.originalFileName || 'Uploaded_Document'}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Uploaded on: {uploadedTask.uploadedAt ? new Date(uploadedTask.uploadedAt).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
            <a
              href={`https://taxfollow-backend.onrender.com${uploadedTask.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink size={14} /> View File
            </a>
          </div>
        </div>
      ) : (
        /* File Upload Box */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload size={18} className="text-emerald-400" />
              {isEditing ? 'Replace Uploaded Document' : 'Upload Required Documents'}
            </h2>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-slate-400 text-xs mb-4">
            Upload Form 16, Bank Statements, ya ID proof (PDF, JPG, PNG).
          </p>

          {feedbackMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} /> {feedbackMsg}
            </div>
          )}

          <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-emerald-400 hover:file:bg-slate-600 cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-medium rounded-lg text-xs transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Uploading...
                </>
              ) : isEditing ? (
                'Save & Overwrite'
              ) : (
                'Submit Document'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-6">Filing Progress & Status Timeline</h2>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-700">
          {(data.tasks && data.tasks.length > 0
            ? data.tasks
            : []
          ).map((task: any, index: number) => {
            const isCompleted = task.status === 'Completed' || task.status === 'Uploaded';
            const isInProgress = task.status === 'In Progress';

            return (
              <div key={task._id || index} className="relative flex items-start gap-4 pl-10">
                <div
                  className={`absolute left-1.5 top-1 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : isInProgress
                      ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                      : 'bg-slate-800 border-slate-600 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                <div className="flex-1 bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isInProgress
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  {task.remarks && <p className="text-slate-400 text-xs">{task.remarks}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}