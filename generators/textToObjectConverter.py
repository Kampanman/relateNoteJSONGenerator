import os
import re
import json
import tkinter as tk
from tkinter import filedialog, messagebox

def main():
    # --- GUIルートウィンドウを非表示で初期化 ---
    root = tk.Tk()
    root.withdraw()

    # --- フォルダ指定メッセージ ---
    print("オブジェクト化対象のtxtファイルが格納されている「object_text」フォルダを指定してください。")

    # --- フォルダ選択ダイアログ ---
    selected_folder = filedialog.askdirectory(title="object_textの指定")

    # ダイアログをキャンセルした場合
    if not selected_folder:
        print("フォルダが選択されませんでした。")
        print("申し訳ありませんが、本処理を終了します。任意のキーを押下するとプロンプトが閉じられます。")
        input()
        return

    # --- バリデーション: フォルダ名チェック ---
    folder_name = os.path.basename(selected_folder)
    if folder_name != "object_text":
        print("選択されたフォルダの名称が「object_text」ではありませんでした。")
        print("申し訳ありませんが、本処理を終了します。任意のキーを押下するとプロンプトが閉じられます。")
        input()
        return

    # --- バリデーション: txtファイル存在チェック ---
    txt_files = [f for f in os.listdir(selected_folder) if f.lower().endswith(".txt")]
    if not txt_files:
        print("フォルダ内部にtxtファイルがありませんでした。")
        print("申し訳ありませんが、本処理を終了します。任意のキーを押下するとプロンプトが閉じられます。")
        input()
        return

    # --- 「created」フォルダを作成 ---
    created_folder = os.path.join(selected_folder, "created")
    os.makedirs(created_folder, exist_ok=True)

    # --- txtファイルを順番に処理 ---
    for txt_file in sorted(txt_files):
        process_txt_file(selected_folder, created_folder, txt_file)

    print("オブジェクトテキスト生成処理が完了しました。任意のキーを押下するとプロンプトが閉じられます。")
    input()

def process_txt_file(folder_path, created_folder, filename):
    """txtファイル処理"""

    # タイトル取得（拡張子なし）
    txt_title = os.path.splitext(filename)[0]

    # ファイル読み込み
    file_path = os.path.join(folder_path, filename)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 「-」が3つ以上連続している箇所を「---」に変換
    content = re.sub(r"-{3,}", "---", content)

    # 改行を \n に統一（\r\n → \n、\r → \n）
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    # 「---\n」で分割して配列化
    parts = content.split("---\n")

    # 各要素をオブジェクト化
    object_text = [{"text": part} for part in parts]

    # JSON文字列に変換（日本語をそのまま出力、ensure_ascii=False）
    json_str = json.dumps(object_text, ensure_ascii=False)

    # 出力ファイルパス
    output_filename = f"json_object__{txt_title}.txt"
    output_path = os.path.join(created_folder, output_filename)

    # ファイル書き込み
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json_str)

    print(f"  処理完了: {filename} → {output_filename}")

if __name__ == "__main__":
    main()
