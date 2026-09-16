# -*- coding: utf-8 -*-
"""
Notebook padrao de analise grafica do projeto WeekInLoop - Biometria nos anos iniciais.

Uso esperado no Google Colab:
1. Configure SPREADSHEETS_ID nas variaveis/Secrets do notebook com o ID da planilha
   definido nas Script Properties do Apps Script.
2. Configure FOLDER_ID nas variaveis/Secrets do notebook com o ID da pasta do Drive
   definida nas Script Properties do Apps Script.
3. Execute o notebook para ler as abas da planilha, gerar 2 a 4 graficos e salvar
   PNGs localmente e, quando possivel, na pasta FOLDER_ID.

Dependencias:
    pip install gspread google-auth google-api-python-client pandas matplotlib seaborn
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

PROJECT_NAME = "WeekInLoop - Biometria nos anos iniciais"
OUTPUT_DIR = Path(os.environ.get("GRAPHICS_OUTPUT_DIR", "/tmp/graficos"))
MAX_CHARTS = int(os.environ.get("MAX_CHARTS", "4"))

SPREADSHEET_ENV_KEYS = ("SPREADSHEETS_ID", "SPREADSHEET_ID")
FOLDER_ENV_KEYS = ("FOLDER_ID", "OUTPUT_FOLDER_ID", "DRIVE_OUTPUT_FOLDER_ID", "DRIVE_FOLDER_ID")


def _read_secret(name: str) -> Optional[str]:
    """Read a value from Colab Secrets when running in Colab."""
    try:
        from google.colab import userdata  # type: ignore
        value = userdata.get(name)
        return value.strip() if isinstance(value, str) and value.strip() else None
    except Exception:
        return None


def get_config_value(keys: Iterable[str], required: bool = True) -> Optional[str]:
    """Read config from environment first, then from Colab Secrets."""
    for key in keys:
        value = os.environ.get(key)
        if value and value.strip():
            return value.strip()
    for key in keys:
        value = _read_secret(key)
        if value:
            return value
    if required:
        joined = ", ".join(keys)
        raise RuntimeError(f"Configure uma destas variaveis antes de executar: {joined}")
    return None


def authenticate_google():
    """Authenticate in Colab or reuse Application Default Credentials."""
    try:
        from google.colab import auth  # type: ignore
        auth.authenticate_user()
    except Exception:
        pass

    import gspread
    from google.auth import default

    credentials, _ = default(scopes=[
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
    ])
    return credentials, gspread.authorize(credentials)


def open_spreadsheet(gc):
    spreadsheet_id = get_config_value(SPREADSHEET_ENV_KEYS, required=True)
    return gc.open_by_key(spreadsheet_id)


def worksheet_to_frame(worksheet) -> pd.DataFrame:
    rows = worksheet.get_all_values()
    if not rows:
        return pd.DataFrame()
    headers = [str(h).strip() or f"col_{idx + 1}" for idx, h in enumerate(rows[0])]
    df = pd.DataFrame(rows[1:], columns=headers)
    df = df.dropna(how="all")
    df = df.loc[:, [col for col in df.columns if str(col).strip()]]
    return df


def load_workbook_frames(spreadsheet) -> Dict[str, pd.DataFrame]:
    frames: Dict[str, pd.DataFrame] = {}
    for worksheet in spreadsheet.worksheets():
        df = worksheet_to_frame(worksheet)
        if not df.empty:
            frames[worksheet.title] = coerce_types(df)
    if not frames:
        raise RuntimeError("Nenhuma aba com dados foi encontrada na planilha.")
    return frames


def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in out.columns:
        series = out[col].astype(str).str.strip()
        numeric = pd.to_numeric(series.str.replace(",", ".", regex=False), errors="coerce")
        if numeric.notna().sum() >= max(3, int(len(out) * 0.5)):
            out[col] = numeric
            continue
        dates = pd.to_datetime(series, errors="coerce", dayfirst=True)
        if dates.notna().sum() >= max(3, int(len(out) * 0.5)):
            out[col] = dates
    return out


def save_and_upload(fig, filename: str, credentials=None) -> str:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = filename.lower().replace(" ", "_")
    path = OUTPUT_DIR / safe_name
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    print(f"Grafico salvo localmente: {path}")
    upload_to_drive(path, credentials)
    return str(path)


def upload_to_drive(path: Path, credentials=None) -> Optional[dict]:
    folder_id = get_config_value(FOLDER_ENV_KEYS, required=False)
    if not folder_id:
        print("FOLDER_ID nao configurado; mantendo apenas copia local do grafico.")
        return None
    if credentials is None:
        print("Credenciais indisponiveis; mantendo apenas copia local do grafico.")
        return None
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload

        service = build("drive", "v3", credentials=credentials)
        media = MediaFileUpload(str(path), mimetype="image/png", resumable=True)
        created = service.files().create(
            body={"name": path.name, "parents": [folder_id]},
            media_body=media,
            fields="id, webViewLink",
        ).execute()
        print(f"Grafico enviado ao Drive: {created.get('webViewLink') or created.get('id')}")
        return created
    except Exception as exc:
        print(f"Aviso: falha ao enviar {path.name} para FOLDER_ID ({exc}).")
        return None


def frame_overview(frames: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    return pd.DataFrame([
        {
            "aba": name,
            "linhas": len(df),
            "colunas": len(df.columns),
            "numericas": len(df.select_dtypes(include="number").columns),
            "datas": len(df.select_dtypes(include="datetime").columns),
        }
        for name, df in frames.items()
    ]).sort_values("linhas", ascending=False)


def pick_main_frame(frames: Dict[str, pd.DataFrame]) -> Tuple[str, pd.DataFrame]:
    candidates = sorted(frames.items(), key=lambda item: (len(item[1]), len(item[1].columns)), reverse=True)
    return candidates[0]


def chart_sheet_overview(frames: Dict[str, pd.DataFrame], credentials=None) -> str:
    overview = frame_overview(frames).head(15)
    fig, ax = plt.subplots(figsize=(11, 6))
    sns.barplot(data=overview, y="aba", x="linhas", ax=ax, color="#2f80ed")
    ax.set_title(f"{PROJECT_NAME} - linhas por aba")
    ax.set_xlabel("Linhas")
    ax.set_ylabel("Aba")
    return save_and_upload(fig, "01_overview_abas.png", credentials)


def chart_numeric_distributions(sheet_name: str, df: pd.DataFrame, credentials=None) -> Optional[str]:
    numeric_cols = list(df.select_dtypes(include="number").columns[:4])
    if not numeric_cols:
        return None
    melted = df[numeric_cols].melt(var_name="variavel", value_name="valor").dropna()
    if melted.empty:
        return None
    fig, ax = plt.subplots(figsize=(11, 6))
    sns.boxplot(data=melted, x="variavel", y="valor", ax=ax, color="#27ae60")
    ax.set_title(f"{PROJECT_NAME} - distribuicoes numericas ({sheet_name})")
    ax.set_xlabel("Variavel")
    ax.set_ylabel("Valor")
    ax.tick_params(axis="x", rotation=30)
    return save_and_upload(fig, "02_distribuicoes_numericas.png", credentials)


def chart_top_categories(sheet_name: str, df: pd.DataFrame, credentials=None) -> Optional[str]:
    category_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c]) and not pd.api.types.is_datetime64_any_dtype(df[c])]
    category_cols = [c for c in category_cols if df[c].astype(str).str.strip().nunique() > 1]
    if not category_cols:
        return None
    col = category_cols[0]
    counts = df[col].astype(str).str.strip().replace("", pd.NA).dropna().value_counts().head(12)
    if counts.empty:
        return None
    plot_df = counts.rename_axis(col).reset_index(name="registros")
    fig, ax = plt.subplots(figsize=(11, 6))
    sns.barplot(data=plot_df, y=col, x="registros", ax=ax, color="#f2994a")
    ax.set_title(f"{PROJECT_NAME} - principais categorias de {col} ({sheet_name})")
    ax.set_xlabel("Registros")
    ax.set_ylabel(col)
    return save_and_upload(fig, "03_top_categorias.png", credentials)


def chart_time_series(sheet_name: str, df: pd.DataFrame, credentials=None) -> Optional[str]:
    date_cols = list(df.select_dtypes(include="datetime").columns)
    numeric_cols = list(df.select_dtypes(include="number").columns)
    if not date_cols or not numeric_cols:
        return None
    date_col = date_cols[0]
    numeric_col = numeric_cols[0]
    series = df[[date_col, numeric_col]].dropna().sort_values(date_col)
    if len(series) < 3:
        return None
    grouped = series.groupby(pd.Grouper(key=date_col, freq="D"))[numeric_col].mean().dropna()
    if len(grouped) < 2:
        return None
    fig, ax = plt.subplots(figsize=(11, 6))
    grouped.plot(ax=ax, marker="o", color="#9b51e0")
    ax.set_title(f"{PROJECT_NAME} - serie temporal de {numeric_col} ({sheet_name})")
    ax.set_xlabel("Data")
    ax.set_ylabel(numeric_col)
    return save_and_upload(fig, "04_serie_temporal.png", credentials)


def generate_visualizations(frames: Dict[str, pd.DataFrame], credentials=None) -> List[str]:
    sns.set_theme(style="whitegrid")
    saved: List[str] = []
    main_sheet, main_df = pick_main_frame(frames)

    chart_builders = [
        lambda: chart_sheet_overview(frames, credentials),
        lambda: chart_numeric_distributions(main_sheet, main_df, credentials),
        lambda: chart_top_categories(main_sheet, main_df, credentials),
        lambda: chart_time_series(main_sheet, main_df, credentials),
    ]

    for build in chart_builders:
        if len(saved) >= MAX_CHARTS:
            break
        result = build()
        if result:
            saved.append(result)

    if len(saved) < 2:
        print("Aviso: os dados disponiveis permitiram gerar menos de 2 visualizacoes.")
    return saved


def main() -> List[str]:
    credentials, gc = authenticate_google()
    spreadsheet = open_spreadsheet(gc)
    frames = load_workbook_frames(spreadsheet)
    print(f"Projeto: {PROJECT_NAME}")
    print(f"Abas carregadas: {', '.join(frames.keys())}")
    saved = generate_visualizations(frames, credentials)
    print(f"Total de graficos gerados: {len(saved)}")
    return saved


if __name__ == "__main__":
    main()
