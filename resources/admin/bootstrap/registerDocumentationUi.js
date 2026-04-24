import { ElLoading } from 'element-plus';
import 'element-plus/es/components/loading/style/css';

export default function registerDocumentationUi(app) {
    app.use(ElLoading.directive);
}
