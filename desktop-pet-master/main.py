import json
import os
import pathlib
import queue
import random
import subprocess
import sys
import webbrowser
from datetime import datetime
from pathlib import Path

from PyQt5.QtCore import QSize, Qt, QTimer
from PyQt5.QtGui import QCursor, QIcon, QMovie
from PyQt5.QtWidgets import QAction, QApplication, QLabel, QMainWindow, QMenu, QSystemTrayIcon

from middlewares.self_log import DesktopPetLogger
from moodpet.emotion import build_emotion_state
from moodpet.emotion_camera import EmotionCameraWorker


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "emotion-ferplus-8.onnx"


class DemoWin(QMainWindow):
    def __init__(self):
        super().__init__()
        self._init_logger()
        self.is_follow_mouse = False
        self.condition = 0
        self.emotion_enabled = False
        self.emotion_queue: "queue.Queue" = queue.Queue(maxsize=1)
        self.emotion_worker = EmotionCameraWorker(self.emotion_queue, MODEL_PATH)

        self._init_ui()
        self._init_tray()
        self._init_pet_actions()
        self._init_timers()

        self.move(1650, 20)
        self.show_emotion_state(build_emotion_state("disabled"))

    def _init_logger(self):
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S-%f-")[:-3]
        filename = timestamp + ".log"
        self.log = DesktopPetLogger(pathlib.Path("./logs"), filename)

    def _init_ui(self):
        self.resize(360, 300)
        self.setWindowTitle("MoodPet")
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.SubWindow)
        self.setAutoFillBackground(False)
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setWindowOpacity(1)

        self.bubble = QLabel("", self)
        self.bubble.setGeometry(16, 8, 310, 78)
        self.bubble.setWordWrap(True)
        self.bubble.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)
        self.bubble.setStyleSheet(
            "QLabel {"
            "font: 10pt 'Microsoft YaHei';"
            "color: #223;"
            "background-color: rgba(255, 255, 255, 220);"
            "border: 1px solid rgba(70, 90, 120, 120);"
            "border-radius: 12px;"
            "padding: 8px 10px;"
            "}"
        )

        self.label = QLabel("", self)
        self.label.setGeometry(70, 88, 200, 200)
        self.Action(str(BASE_DIR / "pet" / "init" / "start.gif"))

    def _init_tray(self):
        iconpath = str(BASE_DIR / "mypetico.ico")
        quit_action = QAction("退出", self, triggered=self.quit)
        quit_action.setIcon(QIcon(iconpath))

        self.tray_icon_menu = QMenu(self)
        self.tray_icon_menu.addAction(quit_action)
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon(iconpath))
        self.tray_icon.setContextMenu(self.tray_icon_menu)
        self.tray_icon.show()

    def _init_pet_actions(self):
        pet_dir = BASE_DIR / "pet"
        self.pet1 = []
        for item in os.listdir(pet_dir):
            path = pet_dir / item
            if path.is_file() and path.suffix.lower() == ".gif":
                self.pet1.append(str(path))

    def _init_timers(self):
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.randomAct)
        self.timer.start(5000)

        self.emotion_timer = QTimer(self)
        self.emotion_timer.timeout.connect(self.poll_emotion_result)
        self.emotion_timer.start(500)

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self.is_follow_mouse = True
            self.mouse_drag_pos = event.globalPos() - self.pos()
            event.accept()
            self.setCursor(QCursor(Qt.ClosedHandCursor))
            self.Action(str(BASE_DIR / "pet" / "init" / "move.gif"))

    def mouseMoveEvent(self, event):
        if Qt.LeftButton and self.is_follow_mouse:
            self.move(event.globalPos() - self.mouse_drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.RightButton:
            return
        self.Action(str(BASE_DIR / "pet" / "init" / "stay.gif"))
        self.is_follow_mouse = False
        self.setCursor(Qt.OpenHandCursor)

    def enterEvent(self, event):
        self.setCursor(Qt.OpenHandCursor)

    def execute_action(self, action_config):
        if action_config["type"] == "subprocess.run":
            subprocess.run(action_config["params"], shell=True)
        elif action_config["type"] == "webbrowser":
            webbrowser.open(action_config["params"])
        elif action_config["type"] == "subprocess.Popen":
            subprocess.Popen(action_config["params"], creationflags=subprocess.CREATE_NEW_CONSOLE)

    def contextMenuEvent(self, event):
        root_menu = QMenu("MoodPet", self)

        emotion_action = root_menu.addAction("关闭情绪识别" if self.emotion_enabled else "开启情绪识别")
        root_menu.addSeparator()

        actions = []
        action_configs = []
        self._append_config_menus(root_menu, actions, action_configs)

        root_menu.addSeparator()
        quit_action = root_menu.addAction("退出")
        selected_action = root_menu.exec_(self.mapToGlobal(event.pos()))

        if selected_action == emotion_action:
            self.toggle_emotion_recognition()
        elif selected_action in actions:
            self.execute_action(action_configs[actions.index(selected_action)])
        elif selected_action == quit_action:
            self.quit()

    def _append_config_menus(self, root_menu, actions, action_configs):
        config_path = BASE_DIR / "config" / "menu_config.json"
        try:
            with open(config_path, "r", encoding="utf-8") as config:
                menu_config = json.load(config)
        except Exception as exc:
            self.log.warning("Failed to load menu config: %s", exc)
            return

        for menu_name, items in menu_config.items():
            submenu = root_menu.addMenu(str(menu_name))
            for action_config in items:
                action_configs.append(action_config)
                actions.append(submenu.addAction(action_config["name"]))

    def toggle_emotion_recognition(self):
        if self.emotion_enabled:
            self.emotion_worker.stop()
            self.emotion_enabled = False
            self.show_emotion_state(build_emotion_state("disabled", message="情绪识别已关闭。"))
            return

        self.emotion_enabled = True
        self.show_emotion_state(build_emotion_state("unknown", message="正在启动摄像头情绪识别..."))
        self.emotion_worker.start()

    def poll_emotion_result(self):
        try:
            while True:
                state = self.emotion_queue.get_nowait()
                self.show_emotion_state(state)
        except queue.Empty:
            pass

    def show_emotion_state(self, state):
        self.bubble.setText(state.display_text())

    def quit(self):
        self.emotion_worker.stop()
        app = QApplication.instance()
        if app is not None:
            app.quit()
        self.close()

    def Action(self, action):
        self.movie = QMovie(action)
        self.movie.setScaledSize(QSize(200, 200))
        self.label.setMovie(self.movie)
        self.movie.start()

    def randomAct(self):
        if self.pet1 and not self.condition:
            self.Action(random.choice(self.pet1))
            self.condition = 1
        else:
            self.Action(str(BASE_DIR / "pet" / "init" / "stay.gif"))
            self.condition = 0
        self.timer.start(random.randint(10, 30) * 1000)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setWindowIcon(QIcon(str(BASE_DIR / "mypetico.ico")))
    mainWin = DemoWin()
    mainWin.show()
    sys.exit(app.exec_())
