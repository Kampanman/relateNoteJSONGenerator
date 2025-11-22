import os
import json
import tkinter as tk
from tkinter import filedialog
import shutil

def select_folder():
    """フォルダ選択ダイアログを表示"""
    print("TXTに変換するJSONファイルが格納されているフォルダを指定してください。")
    
    root = tk.Tk()
    root.withdraw()  # メインウィンドウを非表示
    
    folder_path = filedialog.askdirectory(title="フォルダを選択してください")
    
    return folder_path

def parse_json_file(file_path):
    """JSONファイルを解析してTXT内容を生成"""
    with open(file_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    # タイトル（ファイル名として使用）
    title = json_data.get("title", "untitled")
    
    # TXT内容を生成
    lines = []
    contents = json_data.get("contents", [])
    
    for item in contents:
        main_text = item.get("main", "")
        relate_list = item.get("relate", [])
        
        # mainの値を追加
        lines.append(main_text)
        
        # relateに要素がある場合、textの値を追加
        if relate_list:
            for relate_item in relate_list:
                text_value = relate_item.get("text", "")
                # 改行コード(\n)が含まれている場合はそのまま反映
                lines.append(text_value)
    
    return title, lines

def convert_json_to_txt(folder_path):
    """指定フォルダ内のJSONファイルをTXT化"""
    # txtフォルダのパス
    txt_folder = os.path.join(folder_path, "txt")
    
    # txtフォルダが存在する場合は削除して再作成
    if os.path.exists(txt_folder):
        shutil.rmtree(txt_folder)
    
    os.makedirs(txt_folder)
    
    # フォルダ直下のJSONファイルを取得
    json_files = [f for f in os.listdir(folder_path) 
                  if f.endswith('.json') and os.path.isfile(os.path.join(folder_path, f))]
    
    if not json_files:
        print("JSONファイルが見つかりませんでした。")
        return
    
    # 各JSONファイルを処理
    for json_file in json_files:
        json_path = os.path.join(folder_path, json_file)
        
        try:
            title, lines = parse_json_file(json_path)
            
            # TXTファイル名を生成
            txt_filename = title + '.txt'
            txt_path = os.path.join(txt_folder, txt_filename)
            
            # TXTファイルを保存
            with open(txt_path, 'w', encoding='utf-8') as f:
                for line in lines:
                    f.write(line + '\n')
            
            print(f"変換完了: {json_file} -> {txt_filename}")
            
        except Exception as e:
            print(f"エラー ({json_file}): {e}")
            continue

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
        convert_json_to_txt(folder_path)
        print("\nTXT変換処理が完了しました。任意のキーを押すと終了します。")
        input()
    except Exception as e:
        print(f"\nエラーが発生しました: {e}")
        print("任意のキーを押すと終了します。")
        input()

if __name__ == "__main__":
    main()
