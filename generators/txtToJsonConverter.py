import os
import json
import re
import tkinter as tk
from tkinter import filedialog
from datetime import datetime
import shutil

def select_folder():
    """フォルダ選択ダイアログを表示"""
    print("JSONに変換するTXTファイルが格納されているフォルダを指定してください。")
    
    root = tk.Tk()
    root.withdraw()  # メインウィンドウを非表示
    
    folder_path = filedialog.askdirectory(title="フォルダを選択してください")
    
    return folder_path

def parse_txt_file(file_path):
    """TXTファイルを解析してJSON構造を生成"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # タイトルはファイル名から拡張子を除いたもの
    title = os.path.splitext(os.path.basename(file_path))[0]
    
    # 作成日時（現在時刻）
    created = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.399Z")
    
    # contentsの生成
    contents = []
    i = 0

    # 問題行と解答行を判定するための正規表現パターン
    question_pattern = re.compile(r"^(問題|Q)\d*:")
    answer_pattern = re.compile(r"^(解答|回答|A)\d*:")
    
    while i < len(lines):
        line = lines[i].rstrip('\n\r')
        
        # ファイル内の「\n」「\r\n」という文字列を実際の改行コードに変換
        line = line.replace('\\r\\n', '\n').replace('\\n', '\n')

        # 行が問題のパターンにマッチするかチェック
        is_question = question_pattern.match(line)
        
        # 次の行が解答行かチェック
        has_answer = False
        answer_text = ""
        
        if is_question and i + 1 < len(lines):
            next_line = lines[i + 1].rstrip('\n\r')
            # ファイル内の「\n」「\r\n」という文字列を実際の改行コードに変換
            next_line = next_line.replace('\\r\\n', '\n').replace('\\n', '\n')
            # 次の行が解答のパターンにマッチするかチェック
            if answer_pattern.match(next_line):
                has_answer = True
                answer_text = next_line
        
        # JSONオブジェクトを生成
        if has_answer:
            contents.append({
                "main": line,
                "relate": [{"text": answer_text}]
            })
            i += 2  # 問題と解答の2行分進める
        else:
            contents.append({
                "main": line,
                "relate": []
            })
            i += 1
    
    # JSON構造を作成
    json_data = {
        "title": title,
        "created": created,
        "contents": contents
    }
    
    return json_data

def convert_txt_to_json(folder_path):
    """指定フォルダ内のTXTファイルをJSON化"""
    # jsonフォルダのパス
    json_folder = os.path.join(folder_path, "json")
    
    # jsonフォルダが存在する場合は削除して再作成
    if os.path.exists(json_folder):
        shutil.rmtree(json_folder)
    
    os.makedirs(json_folder)
    
    # フォルダ直下のTXTファイルを取得
    txt_files = [f for f in os.listdir(folder_path) 
                 if f.endswith('.txt') and os.path.isfile(os.path.join(folder_path, f))]
    
    if not txt_files:
        print("TXTファイルが見つかりませんでした。")
        return
    
    # 各TXTファイルを処理
    for txt_file in txt_files:
        txt_path = os.path.join(folder_path, txt_file)
        json_data = parse_txt_file(txt_path)
        
        # JSONファイル名を生成（拡張子を.jsonに変更）
        json_filename = os.path.splitext(txt_file)[0] + '.json'
        json_path = os.path.join(json_folder, json_filename)
        
        # JSONファイルを保存（contentsの各要素を1行で出力）
        with open(json_path, 'w', encoding='utf-8') as f:
            # 手動でフォーマットして出力
            f.write('{\n')
            f.write(f'  "title": {json.dumps(json_data["title"], ensure_ascii=False)},\n')
            f.write(f'  "created": {json.dumps(json_data["created"], ensure_ascii=False)},\n')
            f.write('  "contents": [\n')
            
            for i, item in enumerate(json_data["contents"]):
                # 各要素を1行で出力
                item_json = json.dumps(item, ensure_ascii=False)
                if i < len(json_data["contents"]) - 1:
                    f.write(f'    {item_json},\n')
                else:
                    f.write(f'    {item_json}\n')
            
            f.write('  ]\n')
            f.write('}')
        
        print(f"変換完了: {txt_file} -> {json_filename}")

def main():
    """メイン処理"""
    # フォルダ選択
    folder_path = select_folder()
    
    if not folder_path:
        print("フォルダが選択されませんでした。プログラムを終了します。")
        return
    
    print(f"\n選択されたフォルダ: {folder_path}\n")
    
    # 変換処理
    try:
        convert_txt_to_json(folder_path)
        print("\nJSON変換処理が完了しました。任意のキーを押すと終了します。")
        input()
    except Exception as e:
        print(f"\nエラーが発生しました: {e}")
        print("任意のキーを押すと終了します。")
        input()

if __name__ == "__main__":
    main()