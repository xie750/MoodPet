import sys, pathlib
import logging
import logging.handlers

class DesktopPetLogger(logging.Logger):
    def __init__(self, archiveDir:pathlib, filename:str) -> None:
        super().__init__(str(archiveDir), level=logging.DEBUG)
        self.filename = filename
        self.archiveDir = archiveDir

        # streamHandler
        self.streamHandler = logging.StreamHandler(sys.stdout)
        self.streamHandler.setLevel(level=logging.DEBUG)
        self.addHandler(self.streamHandler)

        # fileHandler
        self.fileHandler = logging.FileHandler(str(self.archiveDir/self.filename))
        self.fileHandler.setLevel(level=logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        self.fileHandler.setFormatter(formatter)
        self.addHandler(self.fileHandler)

    def idle(self):
        pass

        
