
import time
import json
from utils.utils import download_excel_data, download_html

# 暂时不报告进度，完成后可以邮件通知
def test():
    total = 30
    for i in range(total):
        time.sleep(1)  # 模拟任务，实际中可能是其他操作
        progress = (i + 1) / total * 100
        yield json.dumps({'progress': progress, 'current': i + 1, 'total': total}) + '\n'


def show_html(file_name):
    return download_html(file_name)